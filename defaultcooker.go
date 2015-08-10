package goproxy

import (
	"fmt"
	"strconv"
	"time"
)

type DefaultPresenter struct {
}

func (p *DefaultPresenter) present(s Cookable) {
  fmt.Println("present: ",s)
}

type DefaultCooker struct {
	SimpleCooker
}

func DefaultFormatFolderName(self *SimpleCooker) string {
	return "trace/dump/" + self.menu.Name + "@default#" + strconv.FormatInt(time.Now().Unix(), 10)
}

func (self *DefaultCooker) onDuty() {
	// init virtual functions
	self.formatFolderName = DefaultFormatFolderName

	// call super func
	self.SimpleCooker.onDuty()

	fmt.Println("onDuty : DefaultCooker " + self.folder)
	// init vars
	self.injectFiles = append(self.injectFiles, "default_inject.js")
	self.injectVariables = append(self.injectVariables, "var Default_DEBUG = true;")

	// change or append the presenters
	if self.presenters == nil {
		self.presenters = []Presenter{&DefaultPresenter{}}
	} else {
		self.presenters = []Presenter{&DefaultPresenter{}}
		// self.presenters = append(self.presenters, &DefaultPresenter{})
	}
}

func (self *DefaultCooker) offDuty() {
	fmt.Println("offDuty : DefaultCooker " + self.folder)
	self.SimpleCooker.offDuty()
}

func (self *DefaultCooker) wash(s Cookable) Cookable {
  self.feed(s)
	return s
}

func (self *DefaultCooker) prepare(s Cookable) Cookable {
	return s
}

func (self *DefaultCooker) cook(s Cookable) Cookable {
	return s
}
