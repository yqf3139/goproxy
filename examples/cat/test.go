package main
import (
    "os"
    "fmt"
    //"encoding/csv"
)
func    main(){
    f,err:=os.Open("config/menu.json")
    if err != nil {
        panic(err)
    }
    buf :=make([]byte,10)
    n,_:=f.Read(buf);
    fmt.Println(string(buf[:n]))
    defer f.Close()
}
