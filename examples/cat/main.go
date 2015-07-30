package main

import (
	"flag"
	"goproxy"
	"net"
	"strings"
	"encoding/json"
  "fmt"
	"os"
)

func check(err error) {
  if err != nil {
      panic(err)
  }
}

func readConfig(menufile string, configfile string) (string, string) {
	menulist, config := "", ""
	f,err:=os.Open(menufile)
	defer f.Close()
	check(err)

	buf :=make([]byte,1024)
	n := 0
	for n,_=f.Read(buf); n == 1024; n,_=f.Read(buf) {
		menulist += string(buf[:n])
	}
	menulist += string(buf[:n])

	return menulist, config
}

func main() {
	verbose := flag.Bool("v", false, "should every proxy request be logged to stdout")
	addr := flag.String("addr", ":8080", "proxy listen address")
	menufile := flag.String("menu", "config/menu.json", "the menu config file location")
	inter := flag.String("inter", "wlan0", "the server network interface")
	configfile := flag.String("config", "config/config.json", "the config file")

	flag.Parse()

	ifi, err := net.InterfaceByName(*inter)
  check(err)
  addrs, err := ifi.Addrs()
  check(err)
	localaddr := strings.Split(addrs[0].String(), "/")[0]

	menulist, _ := readConfig(*menufile, *configfile)

	// Parse the menu json file to local variable
	var menus goproxy.MenuList
	json.Unmarshal([]byte(menulist), &menus)

	schedules := make([]*goproxy.Menu, len(menus.Menus))
	for index, _ := range menus.Menus {
		schedules[index] = &menus.Menus[index]
		fmt.Println(*schedules[index])
	}

	kitchen := goproxy.Kitchen{
		Schedules : schedules,
		Addr : localaddr,
		Cookers : [2]([]*goproxy.Cooker){
			make([]*goproxy.Cooker, 10),
			make([]*goproxy.Cooker, 10)},
		Proxy : goproxy.NewProxyHttpServer(),
	}
	kitchen.Proxy.Verbose = *verbose

	kitchen.Open(addr)

}
