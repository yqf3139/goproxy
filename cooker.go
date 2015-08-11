package goproxy
import (
	"fmt"
  "strconv"
  "time"
  "os"
)

type Presenter interface {
    present(s Cookable)
}

type Cookable map[string]interface{}

type Cooker interface {
		onDuty()
		offDuty()
		dumpRaw(s string)

		wash(s Cookable) Cookable
		prepare(s Cookable) Cookable
		cook(s Cookable) Cookable
		present(s Cookable)

		getInject() ([]string, []string)
		isCooking() bool
		setCooking(bool,func(Cookable))
		isReady() bool
}

type SimplePresenter struct {}

func (p *SimplePresenter) present(s Cookable)  {
}

func simpleFormatFolderName(self *SimpleCooker) string {
		return "trace/dump/"+self.menu.Name + "#" + strconv.FormatInt(time.Now().Unix(),10)
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

		// callback functions
		feed func (Cookable)

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

func (self *SimpleCooker) wash(s Cookable) Cookable {
    return s
}

func (self *SimpleCooker) dumpRaw(s string) {
    if self.menu.NeedRaw {
        self.raw.WriteString(s+"\n")
    }
}

func (self *SimpleCooker) prepare(s Cookable) Cookable {
    return s
}

func (self *SimpleCooker) cook(s Cookable) Cookable {
    return s
}

func (self *SimpleCooker) isCooking() bool {
    return self.cooking
}

func (self *SimpleCooker) setCooking(b bool, feed func(Cookable)) {
    self.cooking = b
		self.feed = feed
}

func (self *SimpleCooker) isReady() bool {
    return self.ready
}

func (self *SimpleCooker) present(s Cookable) {
	for _, persenter := range self.presenters {
		persenter.present(s)
	}
}

func (self *SimpleCooker) getInject() ([]string, []string) {
	return self.injectFiles, self.injectVariables
}
