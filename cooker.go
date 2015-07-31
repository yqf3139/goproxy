package goproxy
import (
	"fmt"
  "strconv"
  "time"
  "os"
)

const(
    DEFAULT = "DEFAULT"
    WEBGL   = "WEBGL"      // WEBGL == 0
    SECURITY = "SECURITY"  // SECURITY == 1
)

type Presenter interface {
    present(s string)
}

type Cooker interface {
		onDuty()
		offDuty()
		wash(s string) string
		dumpRaw(s string)
		prepare(s string) string
		cook(s string) string
		present(s string)

		getInject() ([]string, []string)
		isCooking() bool
		setCooking(b bool)
		isReady() bool
		setReady(b bool)
}

type SimplePresenter struct {}

func (p *SimplePresenter) present(s string)  {
    fmt.Println("present: ",s)
}

func simpleFormatFolderName(self *SimpleCooker) string {
		return "trace/"+self.menu.Name + "#" + strconv.FormatInt(time.Now().Unix(),10)
}

type SimpleCooker struct {
    menu *Menu
		cooking bool
		ready bool
    folder string
    injectFiles []string
		injectVariables []string
    raw *os.File
    presenters []Presenter

		// virtual functions
		formatFolderName func (self *SimpleCooker) string
}

func (self *SimpleCooker) onDuty() {
	// init virtual functions
	if self.formatFolderName == nil{
		self.formatFolderName = simpleFormatFolderName;
	}

  // init vars
  self.folder = self.formatFolderName(self)
  self.injectFiles = []string{"inject.js"}
	self.injectVariables = []string{"var WSDEBUG = true;"}

	fmt.Println("onDuty : SimpleCooker "+self.folder)

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

func (self *SimpleCooker) offDuty() {
	fmt.Println("offDuty : SimpleCooker "+self.folder)

  // close dump file
  if self.menu.NeedRaw {
      self.raw.Close()
  }
}

func (self *SimpleCooker) wash(s string) string {
    return s
}

func (self *SimpleCooker) dumpRaw(s string) {
    if self.menu.NeedRaw {
        self.raw.WriteString(s)
    }
}

func (self *SimpleCooker) prepare(s string) string {
    return s
}

func (self *SimpleCooker) cook(s string) string {
    return s
}

func (self *SimpleCooker) isCooking() bool {
    return self.cooking
}

func (self *SimpleCooker) setCooking(b bool) {
    self.cooking = b
}

func (self *SimpleCooker) isReady() bool {
    return self.ready
}

func (self *SimpleCooker) setReady(b bool) {
    self.ready = b
}

func (self *SimpleCooker) present(s string) {
	for _, persenter := range self.presenters {
		persenter.present(s)
	}
}

func (self *SimpleCooker) getInject() ([]string, []string) {
	return self.injectFiles, self.injectVariables
}
