#!/usr/bin/env node
import 'shelljs/global'
import getPixels from "get-pixels"


const press_coefficient = 1.392
const piece_body_width = 80
const [swipe_x1, swipe_y1, swipe_x2, swipe_y2] = [320, 410, 320, 410]

async function init() {
    while (true) {
        const data = await new Promise((resolve, reject) => {
            // 截图
            screenshot()
            getPixels("images/1.png", function (err, pixels) {
                const [width, height] = pixels.shape
                const data = pixels.data
                const underScore = 320 * width * 4
                const sample_board_x1 = 353
                const sample_board_y1 = 859
                const sample_board_x2 = 772
                const sample_board_y2 = 1100
                const piece = findPiece()
                const board = findBoard(piece.x, piece.y)
                resolve({
                    piece,
                    board
                })


                // 找到棋子起跳点
                function findPiece() {
                    let line = { // 存储棋子的最低行数据
                        x_arr: [],
                        y: -1
                    }
                    for (let i = underScore; i < pixels.size; i += 4) {
                        const x = (i / 4) % width
                        const y = Math.ceil(i / 4 / width)
                        // 找到棋子最低行
                        if (50 < data[i] && data[i] < 60 && 53 < data[i + 1] && data[i + 1] < 63 && 95 < data[i + 2] && data[i + 2] < 110) {
                            if (y > line.y) {
                                line = {
                                    x_arr: [x],
                                    y
                                }
                            } else {
                                line.x_arr.push(x)
                            }
                        }
                    }
                    return {
                        x: line.x_arr[parseInt(line.x_arr.length / 2)],
                        y: line.y - 25
                    }
                }

                // 找到物体
                function findBoard(piece_x, piece_y) {
                    let answer = {
                        x: -1,
                        y: -1
                    }
                    for (let i = underScore; i < pixels.size; i += 4) {
                        const x = (i / 4) % width
                        const y = Math.ceil(i / 4 / width)
                        // 找到背景色
                        const bg = [data[y * width * 4], data[y * width * 4 + 1], data[y * width * 4 + 2]]
                        if (Math.abs(x - piece_x) < piece_body_width) continue
                        // 找到下一个跳板的x坐标
                        if (judgeBg(i, bg)) { // 找到第一个非背景色的点
                            const line = [x]
                            // 遍历当前行的剩余点
                            for (let j = i; j < (y + 1) * width * 4; j += 4) {
                                if (judgeBg(j, bg)) {
                                    line.push((j / 4) % width)
                                }
                            }
                            answer.x = line[parseInt(line.length / 2)]
                            answer.y = piece_y - Math.abs(answer.x - piece_x) * Math.abs(sample_board_y1 - sample_board_y2) / Math.abs(sample_board_x1 - sample_board_x2)
                            break
                        }
                    }
                    return answer

                    // 判断是否 不是背景色点
                    function judgeBg(index, bg) {
                        return (Math.abs(data[index] - bg[0]) + Math.abs(data[index + 1] - bg[1]) + Math.abs(data[index + 2] - bg[2]) > 10)
                    }
                }

            })
        })
        jump(Math.sqrt(Math.pow(data.board.x - data.piece.x, 2) + Math.pow(data.board.y - data.piece.y, 2)))
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 500)
        })
    }
}

function jump(distance) {
    let press_time = distance * press_coefficient
    press_time = Math.max(press_time, 200)   // 设置 200 ms 是最小的按压时间
    press_time = parseInt(press_time)
    const cmd = `adb shell input swipe ${swipe_x1} ${swipe_y1} ${swipe_x2} ${swipe_y2} ${press_time}`
    console.log(cmd)
    exec(cmd)
}

function screenshot() {
    exec('adb shell screencap -p /sdcard/1.png')
    exec('adb pull /sdcard/1.png ./images/')
}

init()

