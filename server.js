const net = require('net')
const types = require('./types')
const server = net.createServer()
const users = []

server.on('connection',clientSocket => {

    clientSocket.on('data',data => {
      data = JSON.parse(data.toString().trim())
      switch(data.type){
        case types.login:
            if(users.find(item => item.nickname === data.nickname)){
                return clientSocket.write(JSON.stringify({
                    type: types.login,
                    success:false,
                    message: '该昵称已存在'
                }))
            }

            clientSocket.nickname = data.nickname
            users.push(clientSocket)
            clientSocket.write(JSON.stringify({
                type: types.login,
                success: true,
                nickname:data.nickname,
                message: '登录成功',
                sumUsers: users.length
            }))
            users.forEach(user => {
                if(user !== clientSocket){
                    user.write(JSON.stringify({
                        type: types.log,
                        message: `${data.nickname} 进入了聊天室，当前在线用户： ${users.length}`
                    }))
                }
            })
            break
        case types.broadcast:
            users.forEach(item => {
                item.write(JSON.stringify({
                    type: types.broadcast,
                    nickname: clientSocket.nickname,
                    message: data.message
                }))
            })
            break
        case types.p2p:
            const user = users.find(item => item.nickname === data.nickname)
            if(!user){
                return clientSocket.write(JSON.stringify({
                    type: types.p2p,
                    success: false,
                    message: '该用户不存在'
                }))
            }
            user.write(JSON.stringify({
                type: types.p2p,
                success: true,
                nickname: clientSocket.nickname,
                message: data.message
            }))
            break
        default:
            break
      }
    })
    clientSocket.on('error', () => {
        console.log('有用户离开了')
        const index = users.findIndex(user => user.nickname === clientSocket.nickname)
            if(index !== -1){
                const offlineuser = users[index]
                users.splice(index,1)
                users.forEach(user => {
                    user.write(JSON.stringify({
                        type: types.log,
                        message: `${offlineuser.nickname} 离开了聊天室,当前在线用户：${users.length}`
                    }))
                })
            }
    })
    clientSocket.on('end', () => {
        console.log('有用户离开了。。。')
    })
})

server.listen(3000, () => console.log('server running...'))