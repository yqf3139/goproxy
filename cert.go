package goproxy

import (
	"log"
	"os/exec"
  "runtime/debug"
  "fmt"
)

func createServerCertKey(host string) {
  fmt.Printf("gen cert for "+host)

	_, err := callCommand("openssl", "genrsa", "-out", "mycert1.key", "2048")
	if err != nil {
		log.Fatal("Could not create private server key")
	}

	_, err = callCommand("openssl", "req", "-new", "-out", "mycert1.req", "-key", "mycert1.key", "-subj", "/CN="+host)
	if err != nil {
		log.Fatal("Could not create private server certificate signing request")
	}

	_, err = callCommand("openssl", "x509", "-req", "-in", "mycert1.req", "-out", "mycert1.cer", "-CAkey", "myCA.key", "-CA", "myCA.cer", "-days", "365", "-CAcreateserial", "-CAserial", "serial")
	if err != nil {
		log.Fatal("Could not create private server certificate")
	}

  fmt.Printf(" done\n")
}

func callCommand(command string, arg ...string) (string, error) {
	out, err := exec.Command(command, arg...).Output()

	if err != nil {
		log.Println("callCommand failed!")
		log.Println("")
		log.Println(string(debug.Stack()))
		return "", err
	}
	return string(out), nil
}
