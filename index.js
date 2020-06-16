const log = console.log.bind(console)
log('mine sweeping !!!')

const e = selector => document.querySelector(selector)

const es = selector => document.querySelectorAll(selector)

// 实现扫雷程序的流程如下
// 1, 生成扫雷数据
// 2, 根据扫雷数据画图
// 3, 点击的时候根据情况判断
//
// 为了方便, 我们跳过第一步, 直接用下面给定的数据即可, 这样方便测试
// 直接写死数据
// let s = ' [[9,1,0,0,0,1,1,1,0],[1,1,0,0,1,2,9,1,0],[1,1,1,0,1,9,2,1,0],[1,9,2,1,1,1,1,0,0],[1,2,9,1,0,0,1,1,1],[1,2,1,1,0,1,2,9,1],[9,1,0,0,1,2,9,2,1],[1,2,1,1,1,9,2,1,0],[0,1,9,1,1,1,1,0,0]]'
// 把字符串转成数组
// let square = JSON.parse(s)

// 以我们这个数据为例, 网页布局实际上应该 9 * 9 的格子
// cell 用 float 完成布局, clearfix 是用来解决浮动的方案
// 每一行处理成下面的形式
// data-number 是数字, data-x 和 data-y 分别是数组中的下标
// <div class="row clearfix">
//     <div class="cell" data-number="9" data-x="0" data-y="0">9</div>
//     <div class="cell" data-number="1" data-x="0" data-y="1">1</div>
//     <div class="cell" data-number="0" data-x="0" data-y="2">0</div>
//     <div class="cell" data-number="0" data-x="0" data-y="3">0</div>
//     <div class="cell" data-number="0" data-x="0" data-y="4">0</div>
//     <div class="cell" data-number="1" data-x="0" data-y="5">1</div>
//     <div class="cell" data-number="1" data-x="0" data-y="6">1</div>
//     <div class="cell" data-number="1" data-x="0" data-y="7">1</div>
//     <div class="cell" data-number="0" data-x="0" data-y="8">0</div>
// </div>

let s = '[[9,1,0,0,0,1,1,1,0],[1,1,0,0,1,2,9,1,0],[1,1,1,0,1,9,2,1,0],[1,9,2,1,1,1,1,0,0],[1,2,9,1,0,0,1,1,1],[1,2,1,1,0,1,2,9,1],[9,1,0,0,1,2,9,2,1],[1,2,1,1,1,9,2,1,0],[0,1,9,1,1,1,1,0,0]]'

const safe_cell = 0
const mine_cell = 9

const level_config = {
    low: {
        rows: 10,
        cols: 10,
        mines: 10,
    },
    middle: {
        rows: 16,
        cols: 16,
        mines: 40,
    },
    high: {
        rows: 18,
        cols: 24,
        mines: 99,
    }
}

// 全局变量
let mineRemained = 0
let firstClick = true // 是否第一次点击
let minutes = 0  // 分
let seconds = 0  // 秒
let millSeconds = 0 // 毫秒
let timeValue = 0 // setInterval 返回值

let level = 'low' // 游戏难度

const initialGlobalData = function () {
    mineRemained = 0
    firstClick = true // 是否第一次点击
    minutes = 0  // 分
    seconds = 0  // 秒
    millSeconds = 0 // 毫秒
    timeValue = 0 // setInterval 返回值
}


// 初始化 生成一个空白的地雷区域
const createSafeSquare = function (rows, cols, mines) {
    log('mines', mines)
    mineRemained = mines
    let arr = new Array(rows).fill(1)
    let safeSquare = arr.map(item => new Array(cols).fill(safe_cell))
    return safeSquare
}

// Fisher–Yates shuffle 洗牌算法
const shuffle = function (arr) {
    let len = arr.length
    for (let i = len; i > 0 ; i--) {
        let random = Math.floor(Math.random() * i)
        // 交换
        let temp = arr[i - 1]
        arr[i - 1] = arr[random]
        arr[random] = temp
    }
    // log('shuffle arr', arr)
    return arr
}

// 一维数组转二维数组
const arrTrans = function (arr, cols) {
    let r = []
    while (arr.length > 0) {
        r.push(arr.splice(0, cols));
    }
    return r
}

// 计算周边雷的数据 - fe7作业9
const plus1 = function(array, x, y) {
    // 什么情况下可以 +1
    // 1. 不能是 9
    // 2. 不能越界 x是行号，y是列号
    let n = array.length
    if (x >= 0 && x < n && y >= 0 && y < n) {
        if (array[x][y] !== 9) {
            array[x][y] += 1
        }
    }
}

const markAround = function(array, x, y) {
    if (array[x][y] === 9) {
        // 标记周围 8 个
        // 本来标记的时候需要判断是不是可以标记
        // 比如要标记左上角, 要判断 x > 0, y > 0
        // 这种判断非常麻烦, 所以我们直接把这个判断丢到下一层函数去处理
        const around = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1],
        ]

        for (let i = 0; i < around.length; i++) {
            let point = around[i]
            let pointX = x + point[0]
            let pointY = y + point[1]
            plus1(array, pointX, pointY)
        }
    }
}

const clonedSquare = function(array) {
    let arrayNew = []
    for (let i = 0; i < array.length; i++) {
        let arrayLine = array[i].slice(0)
        arrayNew.push(arrayLine)
    }
    return arrayNew
}

const markedSquare = function(array) {
    let square = clonedSquare(array)
    for (let i = 0; i < square.length; i++) {
        let line = square[i]
        for (let j = 0; j < line.length; j++) {
            markAround(square, i, j)
        }
    }
    return square
}

// 0.1创建地雷数据方阵
const createSquare = function (rows, cols, mines) {
    const safeCellNum = rows * cols - mines
    const safeArea = new Array(safeCellNum).fill(safe_cell)
    const mineArea = new Array(mines).fill(mine_cell)
    let totalArea = safeArea.concat(mineArea)
    let shuffleArea = shuffle(totalArea)
    // 分裂成二维数组
    let square = arrTrans(shuffleArea, cols)
    let mineSquare = markedSquare(square)
    // log('mineSquare', mineSquare)
    return mineSquare
}



// 1. templateCell 函数, 参数为数组 line 和变量 x, x 表示第几行
// 返回 line.length 个 cell 拼接的字符串
const templateCell = function(line, x) {
    let s0 = ``
    for (let i = 0; i < line.length; i++) {
        let cell = line[i]
        let color = (i + x) % 2 === 0 ?  'light' : 'dark'
        s0 += `
           <div class="cell" data-number="${cell}" data-x="${x}" data-y="${i}" data-color="${color}">${cell}</div>
        `
    }
    let s = `<div class="row clearfix">\n` + s0 + `</div>\n`
    return s
}

// 2. templateRow 的参数 square 是二维数组, 用来表示雷相关的数据
// 返回 square.length 个 row 拼接的字符串
// row 的内容由 templateCell 函数生成
const templateRow = function(square) {
    let s = ``
    for (let i = 0; i < square.length; i++) {
        let line = square[i]
        s += templateCell(line, i)
    }
    return s
}

// 3. square 是二维数组, 用来表示雷相关的数据
// 用 square 生成 9 * 9 的格子, 然后插入到页面中
// div container 是 <div id="id-div-mime"></div>
const renderSquare = function(square) {
    let html = templateRow(square)
    let container = e('#id-div-mime')
    container.innerHTML = ''
    container.insertAdjacentHTML("beforeend", html)
}

// 4. 实现 bindEventDelegate 函数, 只处理格子, 也就是 .cell 元素
const bindEventDelegate = function(square) {
    let cells = es('.cell')
    for (let i = 0; i < cells.length; i++) {
        let cell = cells[i]
        cell.addEventListener('contextmenu', function(event) {
            event.preventDefault()
            bindEventShowFlag(cell)
        })
        cell.addEventListener('click', function(event) {
            let target = event.target
            // log('target', target)
            vjkl(target, square)
        })
    }
}

// 生成第一次点击点除外的雷区
const createMineSquare = function (x, y) {
    let r = level_config[level]
    let square = createSquare(r.rows, r.cols, r.mines)
    if (square[x][y] === 0) {
        let container = e('#id-div-mime')
        container.innerHTML = ''
        renderSquare(square)
        bindEventDelegate(square)
        let cell = e( `[data-x = "${x}"][data-y = "${y}"]`)
        cell.classList.add('opend')
        vjklAround(square, cell.dataset.x, cell.dataset.y)
        firstClick = false
    } else {
        createMineSquare(x, y)
    }
}

// 5. vjkl 是点击格子的函数
// 要注意的是我们在初始情况下就把数字写到了 html 中 <div class="cell" data-number="1" data-x="0" data-y="1">1</div>
// 而初始情况下数字不应该显示出来的, 可以直接用 font-size: 0; 来隐藏文字
// 点击的时候根据情况用 font-size: 14px; (当然这一步应该用 class 来完成, 比如添加 opened class) 的方式显示文字
// 如果已经显示过, 则不做任何处理
// 如果没有显示过, 判断下列情况
// 1. 如果点击的是 9, 展开, 游戏结束
// 2. 如果点击的是 0, 展开并且调用 vjklAround 函数
// 3. 如果点击的是其他数字, 展开
const vjkl = function(cell, square) {
    let content = cell.dataset.number
    // 第一次点击 确保点击的是0 就会有大面积被翻开
    if (firstClick) {
        timeValue =setInterval(timer,50);
        createMineSquare(cell.dataset.x, cell.dataset.y)
    } else {
        // 如果没有显示过, 判断下列情况
        if (!cell.classList.contains('opend') && !cell.classList.contains('showFlag')) {
            if (content === '9') {
                cell.classList.add('opend')
                showInfoModal('fail')
                return
            } else if (content === '0') {
                cell.classList.add('opend')
                vjklAround(square, cell.dataset.x, cell.dataset.y)
            } else {
                cell.classList.add('opend')
            }
        }
    }
    if (isGameSuccess()) {
        showInfoModal('success')
    }

}


// 6. vjklAround 展开周围 cell 周围 8 个元素, x 和 y 分别是下标
// 展开周围的元素通过调用 vjkl1 来解决
const vjklAround = function(square, x, y) {
    x = Number(x)
    y = Number(y)
    const around = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],[0, 1],
        [1, -1],[1, 0],[1, 1],
    ]
    for (let i = 0; i < around.length; i++) {
        let point = around[i]
        let pointX = x + point[0]
        let pointY = y + point[1]
        vjkl1(square, pointX, pointY)
    }
}

// 7. vjkl1 是重点函数
// 如果满足边界调节, 则继续
// 因为 vjkl1 这个函数是展开格子, 所以如果已经展开过, 那么就不展开元素, 这个是递归终止条件
// 根据 x 和 y 还有属性选择器选择出格子, 具体可以参考 https://developer.mozilla.org/zh-CN/docs/Web/CSS/Attribute_selectors
// 选择出格子之后拿到格子上面放的元素
// 如果没有展开过, 判断下列情况
// 如果碰到的是 9, 什么都不做. 注意, 这里 9 的处理方式和直接点击格子 9 的处理方式不一样
// 如果碰到的是 0, 递归调用 vjklAround 函数
// 如果碰到的是其他元素, 展开
const vjkl1 = function(square, x, y) {
    let rows = square.length
    let columns = square[0].length
    // 满足边界条件
    if (x >= 0 && x < rows && y >= 0 && y < columns) {
        let cell = e( `[data-x = "${x}"][data-y = "${y}"]`)
        let content = cell.dataset.number
        if (!cell.classList.contains('opend')) {
            if (content === '9') {
                return
            } else if (content === '0') {
                cell.classList.add('opend')
                vjklAround(square, cell.dataset.x, cell.dataset.y)
            } else {
                cell.classList.add('opend')
            }
        }
    }
}

// 声音开关的样式
const clearVoiceHide = function() {
    let hideElement = e('.hide')
    // 不是 null 说明找到了这个元素
    if (hideElement !== null) {
        // 使用 classList 可以访问一个元素的所有 class
        // remove 可以删除一个 class
        hideElement.classList.remove('hide')
    }
}

// 声音开关
const bindEventVoiceToggle = function () {
    let imgs = es('.img-voice')
    for (let i = 0; i < imgs.length; i++) {
        let element = imgs[i]
        element.addEventListener('click', function(event) {
            let e = event.target
            clearVoiceHide()
            e.classList.add('hide')
        })
    }
}

// 实时显示雷的数量
const showMineNum = function() {
    let element = e('#id-div-mine-nums')
    element.innerHTML = mineRemained
}

// 计时功能
const timer = function() {
    millSeconds += 50
    if (millSeconds >= 1000) {
        millSeconds = 0
        seconds += 1
    } if (seconds >= 60) {
        seconds = 0
        minutes += 1
    } if (minutes >= 60) {
        showInfoModal('timeOut')
    }
    let element = e('#id-div-timer')
    let str_second = ''
    let str_minute = ''
    if (seconds <= 9) {
        str_second = '0' + seconds
    } else {
        str_second = seconds
    }
    if (minutes < 9) {
        str_minute = '0' + minutes
    }else {
        str_minute = minutes
    }
    let t = str_minute + ':' + str_second
    element.innerHTML = t
}

// 右击 cell 插旗子
const bindEventShowFlag = function (cell) {
    if (!cell.classList.contains('opend')) {
        if (cell.classList.contains('showFlag')) {
            cell.classList.remove('showFlag')
            mineRemained ++
        } else {
            if (mineRemained > 0) {
                cell.classList.add('showFlag')
                mineRemained --
            }
        }
        showMineNum()
    }
    if (isGameSuccess()) {
        showInfoModal('success')
    }
}

// 切换游戏难度等级
const bindEventLevelChange = function () {
    let element = e('#id-select-level')
    element.addEventListener('change', function (event) {
        level = event.target.value
        initialGame(level)
    })
}

// 初始化游戏
const initialGame = function (level) {
    initialGlobalData()
    let r = level_config[level]
    let square = createSafeSquare(r.rows, r.cols, r.mines)
    firstClick = true
    showMineNum()
    renderSquare(square)
    bindEventDelegate(square)
}

// 判断游戏是否成功
const isGameSuccess = function() {
    let cacMineCell = 0
    let cacSafeCell = 0
    let cells = es('.cell')
    for (let i = 0; i < cells.length; i++) {
        let cell = cells[i]
        if (cell.classList.contains('showFlag') && cell.dataset.number === '9') {
            cacMineCell ++
        } else if (cell.classList.contains('opend')) {
            cacSafeCell ++
        }
    }
    // 循环结束后判断所有的雷是否被标记；雷区以外的cell是否被展开
    let mines = level_config[level].mines
    let safeCells = level_config[level].rows * level_config[level].cols - level_config[level].mines
    return (cacMineCell === mines && cacSafeCell === safeCells)
}

const showInfoModal = function(info) {
    window.clearInterval(timeValue)
    let modal = e('.modal')
    let element = e('.modal-info-text')
    element.innerHTML = ''
    let html = ``
    if (info === 'fail') {
        html = `
            <div>
                <img class="fail-img" src="./images/fail.png" alt="fail">
            </div>
        `
    } else if (info === 'success') {
        html = `
            <div>
                <img class="success-img" src="./images/success.png" alt="success">
            </div>
        `
    }
    element.insertAdjacentHTML('beforeend', html)
    modal.classList.add('show')
}

// 再玩一次
const reTryGame = function () {
    let btn = e('.modal-btn')
    // log('btn', btn)
    btn.addEventListener('click', function(event) {
        log('modal click')
        let modal = e('.modal')
        modal.classList.remove('show')
        initialGame(level)
    })
}

const bindEvent = () => {
    initialGame(level)
    bindEventVoiceToggle()
    bindEventLevelChange()
    reTryGame()
}

const __main = function() {
    bindEvent()
}

__main()




