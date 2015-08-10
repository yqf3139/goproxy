package goproxy
import (
	"fmt"
  "strconv"
  "time"
	"os"
	"io/ioutil"
)
type RunnerPresenter struct {

}

func (p *RunnerPresenter) present(s Cookable)  {

}

type RunnerCooker struct {
    SimpleCooker
}

func RunnerFormatFolderName(self *SimpleCooker) string {
		return "trace/dump/"+self.menu.Name + "@Runner#" + strconv.FormatInt(time.Now().Unix(),10)
}

func (self *RunnerCooker) onDuty() {

	if _, err := os.Stat("trace/runner/"+self.menu.Name); os.IsNotExist(err) {
		fmt.Printf("no such file or directory: %s", "trace/runner/"+self.menu.Name)
		os.Mkdir("trace/runner/"+self.menu.Name, 0777)
	}

  // init virtual functions
  self.formatFolderName = RunnerFormatFolderName;

  // call super func
  self.SimpleCooker.onDuty()

	fmt.Println("onDuty : RunnerCooker "+self.folder)
  // init vars
	self.injectFiles = append(self.injectFiles, "fps.js")
  self.injectFiles = append(self.injectFiles, "runner_inject.js")
  self.injectVariables = append(self.injectVariables, "var Runner_DEBUG = true;")

  // change or append the presenters
  if self.presenters == nil{
    self.presenters = []Presenter{&RunnerPresenter{}}
  }else {
    self.presenters = []Presenter{&RunnerPresenter{}}
    // self.presenters = append(self.presenters, &RunnerPresenter{})
  }
}

func (self *RunnerCooker) offDuty() {
	fmt.Println("offDuty : RunnerCooker "+self.folder)
  self.SimpleCooker.offDuty()
}

func (self *RunnerCooker) wash(s Cookable) Cookable {
	var action string
	if value, ok := s["action"].(string); !ok {
		return nil
	}else{
		action = value
	}

	switch action {
		case "push":
			fmt.Println("RunnerCooker push")

			var trace string
			if value, ok := s["trace"].(string); !ok {
				fmt.Println("s trace not ok")
				return nil
			}else{
				trace = value
			}

			id := strconv.FormatInt(time.Now().Unix(),10)
			userFile := "trace/runner/"+self.menu.Name+"/"+id
			fout, err := os.Create(userFile)
	    if err != nil {
	        fmt.Println(userFile, err)
	        return nil
	    }
	    defer fout.Close()
			fout.WriteString(trace)

			delete(s,"trace")
			s["res"] = true
			s["id"] = id
			self.feed(s)

		case "pull":
			fmt.Println("RunnerCooker pull")

			var userFile string
			var trace string
			if value, ok := s["recordId"].(string); !ok {
				return nil
			}else{
				userFile = value
			}
	    f, err := os.Open("trace/runner/"+self.menu.Name+"/"+userFile)
	    if err != nil {
	        fmt.Println(userFile, err)
	        return nil
	    }
	    defer f.Close()

			buf :=make([]byte,1024)
			n := 0
			for n,_=f.Read(buf); n == 1024; n,_=f.Read(buf) {
				trace += string(buf[:n])
			}
			trace += string(buf[:n])

			s["trace"] = trace
			self.feed(s)

		case "list":
			fmt.Println("RunnerCooker list")

			files, _ := ioutil.ReadDir("trace/runner/"+self.menu.Name)
	    fileNames := make([]string, 0)
	    for _, fi := range files {
	      fileNames = append(fileNames, fi.Name())
	    }
	    s["recordList"] = fileNames
			self.feed(s)

		default:
	}

	return nil
}

func (self *RunnerCooker) prepare(s Cookable) Cookable {
    return s
}

func (self *RunnerCooker) cook(s Cookable) Cookable {
    return s
}
