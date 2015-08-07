package goproxy

import (
	"log"
	"net/http"
	"bytes"
	"io/ioutil"
	"io"
	"regexp"
	"fmt"
  "strconv"
	"strings"
	"html/template"
	"net/url"
	"code.google.com/p/go.net/websocket"
)

const (
	WSPORT_START = 10080
	WSPORT_MAX = 10
	HTTP_PORT       = ":8000"
  SSL_PORT       = ":8443"
  PRIV_KEY   = "./mycert1.key"
  PUBLIC_KEY = "./mycert1.cer"
	WSS_PREFIX = "wss"
	WS_PREFIX = "ws"
)

var INJECT_HTTP_PREFIX string
var INJECT_HTTPS_PREFIX string

func (self *Kitchen) IsNotLocalHost() ReqConditionFunc {
	return func(req *http.Request, ctx *ProxyCtx) bool {
		return !( strings.Contains(req.URL.Host, self.Addr) ||
			req.URL.Host == "::1" ||
			req.URL.Host == "0:0:0:0:0:0:0:1" ||
			localHostIpv4.MatchString(req.URL.Host) ||
			req.URL.Host == "localhost")
	}
}

type myReader struct {
    *bytes.Buffer
}
func (m myReader) Close() error { return nil }

type Menu struct {
  Name string
	Urlreg string
  Category string
  NeedRaw bool
}

type MenuList struct {
	Menus []Menu
}

type Kitchen struct {
  Schedules []*Menu
	Addr string
  counter [2]int
  Cookers [2]([]Cooker)
  Proxy *ProxyHttpServer
}

func (self *Kitchen) newWorkflow(index int, ssl int) func (ws *websocket.Conn) {
  return func (ws *websocket.Conn)  {
    var err error
		cooker := self.Cookers[ssl][index]

    if cooker == nil{
			fmt.Println("drop ws conn : cooker is nil")
      return
    }
		if cooker.isCooking() {
			fmt.Println("drop ws conn : cooker.isCooking")
			return
		}
		cooker.setCooking(true)
		fmt.Println("accept ws conn")

		defer func ()  {
			ws.Close()
			cooker.setCooking(false)
			cooker.offDuty()
			self.Cookers[ssl][index] = nil
		}()

		var tmp string = ""

    for {
        var reply string

        if err = websocket.Message.Receive(ws, &reply); err != nil {
            fmt.Println("Can't receive")
            break
        }

				if reply[0]=='[' {
						tmp = reply
				}else{
						tmp = tmp + reply
				}

				if tmp[len(tmp)-1]!=']' {
					continue
				}

        // TODO chain
        reply = cooker.wash(tmp)

				cooker.dumpRaw(tmp)
        if cooker.isReady() {
          reply = cooker.cook(tmp)
        }else {
          reply = cooker.prepare(tmp)
        }

				cooker.present(tmp)
    }
  }
}

func FullUrlMatches(re *regexp.Regexp) ReqConditionFunc {
	return func(req *http.Request, ctx *ProxyCtx) bool {
		// fmt.Println("FullUrlMatches : "+req.URL.String())
		return re.MatchString(req.URL.String())
	}
}

func FullQueryMatches(re *regexp.Regexp) ReqConditionFunc {
	return func(req *http.Request, ctx *ProxyCtx) bool {
		fmt.Println("FullQueryMatches : "+req.URL.RawQuery)
		return re.MatchString(req.URL.RawQuery)
	}
}

func Hello(w http.ResponseWriter, r *http.Request) {
	hp := `<html>
    <head>
    <title>okkkkkk</title>
    </head>
    <body>
        <h2>this is a test for golang.</h2>
    </body>
    </html>`
	io.WriteString(w, hp)
}

func (self *Kitchen) makePac() (func (w http.ResponseWriter, r *http.Request)) {
	return func (w http.ResponseWriter, r *http.Request)  {
		fmt.Println("Baking new PAC file")

		tmpl, _ := template.ParseFiles("pac/pac.tmpl")
		//application/x-ns-proxy-autoconfig
		w.Header().Set("Content-Type", "application/x-ns-proxy-autoconfig")
		w.Header().Set("Expires", "-1")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Pragma", "no-cache")
    tmpl.Execute(w, self)
	}
}

func (self *Kitchen) newCooker(menu *Menu, ssl int) (Cooker, int, bool, string) {
  port := 0
  needCreateNewPort := false
  if self.counter[ssl] < WSPORT_MAX{
      port = self.counter[ssl] + WSPORT_START + ssl*WSPORT_MAX;
			self.counter[ssl]++
      needCreateNewPort = true
  }else {
      for index, item := range self.Cookers[ssl] {
          if item == nil {
            port = WSPORT_START + ssl*WSPORT_MAX + index
            break
          }
      }
  }
  if port == 0 {
    return nil, 0, false, "Sorry, the cookers number is at its max."
  }

	cat := menu.Category

	fmt.Println("new port:%d new name:%s",port, menu.Name)

  switch cat {
  case WEBGL:
		return &WebglCooker{SimpleCooker{menu: menu}}, port, needCreateNewPort, ""
  case SECURITY:
		return nil, 0, false, "SECURITY cooker not implemented"
	case DEFAULT:
    return &SimpleCooker{menu: menu}, port, needCreateNewPort, ""
	default:
		return nil, 0, false, "The "+cat+" cooker is not here, check the spell"
  }
}

func (self *Kitchen) injectResp(resp *http.Response, ctx *ProxyCtx, localmenu *Menu) *http.Response{
	resp.Header["Expires"] = []string{"-1"}
	resp.Header["Cache-Control"] = []string{"no-cache"}
	resp.Header["Pragma"] = []string{"no-cache"}
	resp.Header["Access-Control-Allow-Origin"] = []string{"*"}

	var ssl int = 0;
	if resp.Request.URL.Scheme == "https"{
		ssl = 1;
	}

	kitchen := self
	cooker, port, needCreateNewPort, errMsg := kitchen.newCooker(localmenu, ssl)

	if cooker == nil {
	  return NewResponse(resp.Request,
	    ContentTypeText, http.StatusForbidden,
	    errMsg)
	}

	index := port - ssl*WSPORT_MAX -WSPORT_START
	kitchen.Cookers[ssl][index] = cooker

	cooker.onDuty()

	// launch or reuse a new web socket port
	if needCreateNewPort{
	  go func() {
			if ssl == 1{
				log.Fatal(http.ListenAndServeTLS(":"+strconv.Itoa(port),
					PUBLIC_KEY, PRIV_KEY,
					websocket.Handler(kitchen.newWorkflow(index, ssl))))
			}else{
				log.Fatal(http.ListenAndServe(":"+strconv.Itoa(port),
					websocket.Handler(kitchen.newWorkflow(index, ssl))))
			}
	  }()
	}

	ctx.Logf(" ======== Inject ======== \n")
	buf, _ := ioutil.ReadAll(resp.Body)
	rdr := myReader{bytes.NewBuffer([]byte{})}

	var wsPrefix, urlPrefix string
	if resp.Request.URL.Scheme == "https"{
		wsPrefix, urlPrefix = "wss", INJECT_HTTPS_PREFIX
	}else {
		wsPrefix, urlPrefix = "ws", INJECT_HTTP_PREFIX
	}

	rdr.WriteString(fmt.Sprintf("<script>var WSADDR='%s://%s:%d'</script>",
		wsPrefix, kitchen.Addr, port))

	injectFiles, injectVariables := cooker.getInject()

	for _, variable := range injectVariables {
		rdr.WriteString(fmt.Sprintf("<script>%s</script>",variable))
	}
	for _, filename := range injectFiles {
		rdr.WriteString(fmt.Sprintf("<script src=\"%s%s\"></script>",urlPrefix, filename))
	}
	ctx.Logf(" ======== Inject Done ======== \n")

	rdr.Write(buf)

	resp.Body = rdr // OK since rdr2 implements the io.ReadCloser interface

	return resp
}


func (self *Kitchen) Open(addr *string)  {

	// local addr
	INJECT_HTTP_PREFIX = fmt.Sprintf("http://%s%s/static/", self.Addr, HTTP_PORT)
	INJECT_HTTPS_PREFIX = fmt.Sprintf("https://%s%s/static/", self.Addr, SSL_PORT)

	// gen cert for self
	createServerCertKey(self.Addr)

  // config http/https server to host js and worker js
  http.HandleFunc("/", Hello)
	http.HandleFunc("/i.pac", self.makePac())
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("./static"))))

  go func() {
    err := http.ListenAndServe(HTTP_PORT, nil)
    if err != nil {
      log.Fatal("ListenAndServe: ", err.Error())
    }
  }()

	go func() {
		err := http.ListenAndServeTLS(SSL_PORT, PUBLIC_KEY, PRIV_KEY, nil)
		if err != nil {
			log.Fatal("ListenAndServe: ", err.Error())
		}
	}()

  // config proxy sever to hiject https
  self.Proxy.OnRequest(self.IsNotLocalHost()).HandleConnect(AlwaysMitm)

	// hiject wsworker.js to local for cross origin issue
	self.Proxy.OnRequest(UrlMatches(regexp.MustCompile("wsworker.js$"))).DoFunc(
	func(r *http.Request, ctx *ProxyCtx) (*http.Request, *http.Response) {
		ctx.Logf(" ======== wsworker Inject ======== \n")

		if r.URL.Scheme == "https"{
			r.URL.Host = self.Addr + SSL_PORT
		}else {
			r.URL.Host = self.Addr + HTTP_PORT
		}
		r.URL.Path = "/static/wsworker.js"
		return r, nil
	})

	// create inject function for query
	self.Proxy.OnResponse(ContentTypeIs("text/html"), FullQueryMatches(regexp.MustCompile("inject="))).DoFunc(
		func(resp *http.Response, ctx *ProxyCtx) *http.Response {
			fmt.Println(resp.Request.URL)
			m, _ := url.ParseQuery(resp.Request.URL.RawQuery)

			needRaw := false
			name := resp.Request.Host

			v := m["inject"]
			r := m["raw"]
			n := m["name"]
			if len(r) == 1 && r[0] == "true"{
				needRaw = true
			}
			if len(n) == 1{
				name = n[0]
			}
			return self.injectResp(resp, ctx,
		 		&Menu{Name : name,
					Urlreg : "",
			  	Category : v[0],
			  	NeedRaw : needRaw})
		})

  // create inject function for spec urls
  for _, menu := range self.Schedules {
		// local bindings, for func closures
    re, _ := regexp.Compile(menu.Urlreg)
		localmenu := menu

    self.Proxy.OnResponse(ContentTypeIs("text/html"), FullUrlMatches(re)).DoFunc(
    	func(resp *http.Response, ctx *ProxyCtx) *http.Response {
				fmt.Println(resp.Request.URL)
				return self.injectResp(resp, ctx, localmenu)
    	})
  }



	log.Fatal(http.ListenAndServe(*addr, self.Proxy))
}

func (self *Kitchen) Close()  {

}
