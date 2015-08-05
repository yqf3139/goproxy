package goproxy
import (
	"fmt"
  "strconv"
  "time"
	"encoding/json"
)
type WebglPresenter struct {

}

func (p *WebglPresenter) present(s string)  {
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

type WebglCooker struct {
    SimpleCooker
}

func webglFormatFolderName(self *SimpleCooker) string {
		return "trace/"+self.menu.Name + "@webgl#" + strconv.FormatInt(time.Now().Unix(),10)
}

func (self *WebglCooker) onDuty() {
  // init virtual functions
  self.formatFolderName = webglFormatFolderName;

  // call super func
  self.SimpleCooker.onDuty()

	fmt.Println("onDuty : WebglCooker "+self.folder)
  // init vars
  self.injectFiles = append(self.injectFiles, "webgl_inject.js")
  self.injectVariables = append(self.injectVariables, "var WEBGL_DEBUG = true;")

  // change or append the presenters
  if self.presenters == nil{
    self.presenters = []Presenter{&WebglPresenter{}}
  }else {
    self.presenters = []Presenter{&WebglPresenter{}}
    // self.presenters = append(self.presenters, &WebglPresenter{})
  }
}

func (self *WebglCooker) offDuty() {
	fmt.Println("offDuty : WebglCooker "+self.folder)
  self.SimpleCooker.offDuty()
}

func (self *WebglCooker) wash(s string) string {
    return s
}

func (self *WebglCooker) prepare(s string) string {
    return s
}

func (self *WebglCooker) cook(s string) string {
    return s
}
