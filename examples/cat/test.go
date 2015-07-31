// package main
// import (
//     "fmt"
// )
//
// type I interface {
//   test()
//   f()
// }
//
// type A struct {
//   a int
// }
//
// func (self *A) test()  {
//   var ii I = self
//   ii.f()
// }
//
// func (self *A) f()  {
//   fmt.Println("A:f")
// }
//
// type AA struct {
//   *A
// }
//
// func (self *AA) f()  {
//   self.A.f()
//   fmt.Println("AA:f")
// }
//
// func main(){
//     a := AA{}
//     var i I = &a
//     a.test()
//     i.test()
// }

package main
import "fmt"
type A struct{
  ff func (s string) string
}

func hello(s string) string {
  return "++"+s
}

type B struct {
  A
}

func main() {
  a := B{}
  a.ff = hello
  fmt.Println(a.ff("o"))
}
