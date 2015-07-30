package goproxy
import (
	"fmt"
  "strconv"
  "time"
  "os"
)

const(
		DEFAULT_INJECT_FILE = "inject.js"
    DEFAULT = "DEFAULT"
    WEBGL   = "WEBGL"      // WEBGL == 0
    SECURITY = "SECURITY"  // SECURITY == 1
)

type Presenter interface {
    present(s string)
}

type Interface interface {
}

type SimplePresenter struct {

}

func (p *SimplePresenter) present(s string)  {
    fmt.Println("present: ",s)
}

type Cooker struct {
    port int
    menu *Menu
		isCooking bool
		ready bool
    folder string
    injectFileName string
    raw *os.File
    presenters []Presenter
}

func (self *Cooker) onDuty() {
  // init vars
  self.folder = "trace/"+self.menu.Name + "@" + strconv.Itoa(self.port) + "#" + strconv.FormatInt(time.Now().Unix(),10)
  self.injectFileName = DEFAULT_INJECT_FILE

	fmt.Println("onDuty : Cooker "+self.folder)

  // create folder as a workspace
  os.Mkdir(self.folder, 0777)

  // create raw file to write
  if self.menu.NeedRaw {
      f, err := os.Create(self.folder+"/raw.dump")
      if err != nil {
        fmt.Println(self.folder+"/raw.dump", err)
        panic("the dump file cannot be opened")
    	}
			self.raw = f
  }

  if self.presenters == nil {
    self.presenters = []Presenter{&SimplePresenter{}}
  }
}

func (self *Cooker) offDuty() {
	fmt.Println("offDuty : Cooker "+self.folder)

  // close dump file
  if self.menu.NeedRaw {
      self.raw.Close()
  }
}

func (self *Cooker) wash(s string) string {
    return s
}

func (self *Cooker) dumpRaw(s string) {
    if self.menu.NeedRaw {
				fmt.Println("dumping raw")
        self.raw.WriteString(s)
    }
}

func (self *Cooker) prepare(s string) string {
    return s
}

func (self *Cooker) cook(s string) string {
    return s
}
