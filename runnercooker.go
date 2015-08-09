package goproxy
import (
	"fmt"
  "strconv"
  "time"
	"encoding/json"
)
type RunnerPresenter struct {

}

func (p *RunnerPresenter) present(s string)  {
	var f []interface{}
	b := []byte(s)
	err := json.Unmarshal(b, &f)
	if err != nil{
		fmt.Println("json.Unmarshal err")
		fmt.Println(err)
	}else {
		//fmt.Printf("json len: %d\n", len(f))
	}
}

type RunnerCooker struct {
    SimpleCooker
}

func RunnerFormatFolderName(self *SimpleCooker) string {
		return "trace/"+self.menu.Name + "@Runner#" + strconv.FormatInt(time.Now().Unix(),10)
}

func (self *RunnerCooker) onDuty() {
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

func (self *RunnerCooker) wash(s string) string {
    return s
}

func (self *RunnerCooker) prepare(s string) string {
    return s
}

func (self *RunnerCooker) cook(s string) string {
    return s
}
