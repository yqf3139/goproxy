package main

import (
    "fmt"
    "io/ioutil"
)

func main() {
    files, _ := ioutil.ReadDir("./")
    fileNames := make([]string, 0)
    for _, fi := range files {
      fileNames = append(fileNames, fi.Name())
    }
    fmt.Println(fileNames)
}
