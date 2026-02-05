# Message Contract (MVP)

All messages include a `type` field.

## Client → Server

### JOIN

```
{
  "type": "JOIN",
  "roomId": "abcd"
}
```

### PING

```
{
  "type": "PING",
  "t0": 1700000000000
}
```

### START_REQ

```
{
  "type": "START_REQ",
  "delayMs": 5000
}
```

## Server → Client

### JOINED

```
{
  "type": "JOINED",
  "roomId": "abcd"
}
```

### PONG

```
{
  "type": "PONG",
  "t0": 1700000000000,
  "t1": 1700000000100
}
```

### START

```
{
  "type": "START",
  "startAt": 1700000007000
}
```
