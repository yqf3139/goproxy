package main

import (
    "html/template"
    "os"
)

type Person struct {
    Addr string
}

func main() {
    tmpl, _ := template.ParseFiles("test.tmpl")
    p := Person{Addr: "Astaxie"}
    tmpl.Execute(os.Stdout, p)
}
