package main

import (
	"github.com/gin-gonic/gin"
	"gopkg.in/olahol/melody.v1"
)

func main() {
	server := gin.Default()
	wss    := melody.New()

	server.GET("/", func(context *gin.Context) {
		if wss.HandleRequest(context.Writer, context.Request) != nil {
			println("failed to handle request")
		}
	})

	wss.HandleMessage(func(s *melody.Session, msg []byte) {
		if wss.Broadcast(msg) != nil {
			println("failed to handle message")
		}
		println(string(msg))
	})

	_ = server.Run(":9000")
}