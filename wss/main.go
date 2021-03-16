package main

import (
    "encoding/json"
    "github.com/gin-gonic/gin"
    "gopkg.in/olahol/melody.v1"
    "time"
)

type Event struct {
    Op      int         `json:"op"`
    Type    string      `json:"type"`
    Payload interface{} `json:"payload"`
}

type HelloEvent struct {
    HeartbeatInterval int `json:"heartbeat_interval"`
}

type MessageEvent struct {
    Author  string `json:"author"`
    Content string `json:"content"`
}

func ignore_error(val interface{}, _ error) interface{} {
    return val
}

func main() {
    sessions := make(map[*melody.Session]int64)
    server := gin.Default()
    wss := melody.New()

    server.GET("/", func(context *gin.Context) {
        if wss.HandleRequest(context.Writer, context.Request) != nil {
            println("failed to handle request")
        }
    })

    wss.HandleConnect(func(s *melody.Session) {
        _ = s.Write(ignore_error(json.Marshal(Event{10, "", HelloEvent{60000}})).([]byte))
        sessions[s] = time.Now().UnixNano() / int64(time.Millisecond)
    })

    wss.HandleMessage(func(s *melody.Session, msg []byte) {
        var event Event
        _ = json.Unmarshal(msg, &event)
        switch event.Type {
			case "message_create": {
				println("event message_create:" + string(msg))
				_ = wss.BroadcastOthers(msg, s)
				break
			}
        }
    })

    _ = server.Run(":9000")
}
