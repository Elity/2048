<template>
    <div id="app">
        <ul>
            <li class='box' 
                v-for="num in nums"
                v-text="num"
                v-getclass="num"
                v-getposition="$index"
                track-by="$index">
            </li>
        </ul>
        <div class="mask" v-show='show===1' @click='show=0' transition='show'>
            <div>{{msg}}</div>
        </div>
        <button @click="reset">重置</button>
    </div>    
</template>

<script>
export default {
    data () {
        return {
            show:0,
            msg:'',
            pass:false,
            start : {},  //记录移动端触摸起始点
            nums : []   //记录16个框格的数字
        }
    },
    ready: function () {
        document.addEventListener('keyup', this.keyDown);
        document.querySelector('#app ul').addEventListener('touchstart', this.touchStart);
        document.querySelector('#app ul').addEventListener('touchend', this.touchEnd);
        //document上获取touchmove事件 如果是由.box触发的 则禁止屏幕滚动
        document.addEventListener('touchmove', e=>{
            e.target.classList.contains('box') && e.preventDefault();
        });
        localStorage['save1'] ? this.nums = JSON.parse(localStorage['save1'])
                              : this.reset();
    },
    directives:{
        getclass(value) {
            let classes = this.el.classList;
            [].forEach.call(classes,_=>{
                /^s\w+$/.test(_) && classes.remove(_);
            });
            classes.remove('empty');
            value ? classes.add('s' + value)
                  : classes.add('empty');    
        },
        getposition(index){
            this.el.style.left = index%4*25 + '%';
            this.el.style.top = Math.floor(index/4)*25 + '%';
        }
    },
    methods:{
        /*在一个随机的空白位添加2或4 概率9:1*/
        randomAdd(){
            let arr = this.shuffle(this.blankIndex());
            //延时100毫秒添加
            setTimeout(_=>{
               this.nums.$set(arr.pop(),Math.random()>0.9 ? 4 : 2); 
            },100);
        },
        /*获取当前空白隔索引组成的数组*/
        blankIndex(){
            let arr = [];
            this.nums.forEach((i,j)=>{
                i==='' && arr.push(j);
            });
            return arr;
        },
        /*打乱数组*/
        shuffle(arr){
            let l = arr.length,j;
            while(l--){
                j = parseInt(Math.random()*l);
                [arr[l],arr[j]] = [arr[j],arr[l]]
            }
            return arr;
        },
        /*把数组arr当成矩阵，转置n次*/
        /*
            [1,2,   1次转置变为     [3,1,
            3,4]                     4,2]  
        */
        T(arr,n){
            n=n%4;
            if(n===0)return arr;
            var l = arr.length,d = Math.sqrt(l),tmp = [];
            for(var i=0;i<d;i+=1)
                for(var j=0;j<d;j+=1)
                    tmp[d-i-1+j*d] = arr[i*d+j];
            if(n>1)tmp=this.T(tmp,n-1);
            return tmp;
        },
        touchStart(e){
            this.start['x'] = e.changedTouches[0].pageX;
            this.start['y'] = e.changedTouches[0].pageY;
        },
        touchEnd(e){
            let curPoint = e.changedTouches[0],
                x = curPoint.pageX - this.start.x,
                y = curPoint.pageY - this.start.y,
                xx = Math.abs(x),
                yy = Math.abs(y),
                i = 0;
            //移动范围太小 不处理
            if(xx < 50 && yy < 50)return;    
            if( xx >= yy){ //横向滑动
                i = x < 0 ? 0 : 2;
            }else{//纵向滑动
                i = y < 0 ? 3 : 1;
            }
            this.handle(i);
        },
        /*
        *方向键 事件处理
        *把上、右、下方向通过旋转 变成左向操作
        */
        keyDown(e){
            //左上右下 分别转置0 3 2 1 次
            const map = {
                37: 0, //LEFT
                38: 3, //UP
                39: 2, //RIGHT
                40: 1, //DOWN
                87: 3, // W
                68: 2, // D
                83: 1, // S
                65: 0  // A
            };
            if(!(e.keyCode in map))return;
            this.handle(map[e.keyCode]);
        },
        handle(i){
            this.move(i);
            this.save();
            this.isPass();//判断是否过关
        },
        /*移动滑块 i:转置次数 */
        move(i){
            let indexs = this.T(Object.keys(String(Array(17))),i),//记录旋转前的各个位置索引
                tmp = this.T(this.nums,i),//把任意方向键转置，当成向左移动
                hasMove = false, //一次操作有移动方块时才添加方块
                /*
                *记录已经合并过一次的位置 避免重复合并
                *如 2 2 4 4 在一次合并后应为 4 8 0 0  而非8 4 0 0 
                */
                hasCombin = {};
            tmp.forEach((j,k)=>{
                let newIndex = 0,  //方块挪动后的索引 （转换后的索引）
                    index = indexs[k]-0, //换算到转换前的索引
                    thisMoved = false, //此方块有数字，且被移动了 标记  需要应用动画
                    combinNum = 0; //方块若有合并，记录合并后的数字
                while(k%4 && j!==''){
                    if(tmp[k-1] === ''){ //当前位置的前一位置为空,交换俩位置
                        tmp[k-1] = j;
                        tmp[k] = '';
                        hasMove = true;
                        thisMoved = true;
                        if(hasCombin[k]){//该位置有过合并，挪动后要记录到挪动后的位置
                            hasCombin[k-1] = true;
                            hasCombin[k] = false;
                        }
                        newIndex = k-1;
                    }else if(tmp[k-1] === j && !hasCombin[k] && !hasCombin[k-1]){
                        //当前位置与前一位置数字相同，合并到前一位置，然后清空当前位置
                        j *= 2;
                        tmp[k-1] = j;
                        tmp[k] = '';
                        hasMove = true;
                        thisMoved = true;
                        combinNum = j;
                        hasCombin[k-1] = true;  //记录合并位置
                        newIndex = k-1;
                    }else{
                        break;
                    }
                    k--;
                } 
                thisMoved && this.moveNode(index,indexs[newIndex],combinNum);
            });
            setTimeout(_=>{
                this.nums = this.T(tmp,4-i);//转置回去，把数据还给this.nums
                hasMove && this.randomAdd();
            },100);
        },
        //索引index的元素移动到nextIndex
        moveNode(index,nextIndex,combinNum){
            let allBox = document.querySelectorAll('.box'),
                curEle = allBox[index],//将被移动的元素
                nextEle = allBox[nextIndex].cloneNode(),//合并后的目标元素
                clone = curEle.cloneNode(true),//当前元素克隆 包括里面的数组 用作移动动画
                pEle = curEle.parentNode,
                boxL = index%4*25 + '%',
                boxT = Math.floor(index/4)*25 + '%',
                box = allBox[allBox.length-1].cloneNode();//复制最后一个元素做当前元素的遮罩
            box.className = 'box empty';
            box.style.left = boxL;
            box.style.top = boxT;
            pEle.insertAdjacentElement('beforeEnd',box);
            curEle.style.opacity = 0;
            if(combinNum){
                nextEle.classList.add('combin');
                nextEle.classList.add('s' + combinNum);
                nextEle.innerText = combinNum;
                pEle.insertAdjacentElement('beforeEnd',nextEle);
            }
            clone.style.left === nextIndex%4*25 + '%' ?
            clone.classList.add('y' + Math.floor(nextIndex/4)*25):
            clone.classList.add('x' + nextIndex%4*25);
            pEle.insertAdjacentElement('beforeEnd',clone);
            setTimeout(_=>{
                clone.remove();
                nextEle.remove();
                box.remove();
                curEle.style.opacity = 1;
            },200);
        },
        save(){
           localStorage['save1'] = JSON.stringify(this.nums); 
        },
        //重置游戏
        reset(){
            //[].fill兼容性还是太低
            //this.nums = Array(16).fill('');
            this.nums = Array(16).join('-').split('-');
            let i =0;
            while(i++<2){ //随机添加2个
               this.randomAdd(); 
            } 
            this.show = 0;
        },
        isPass(){
            let isOver=true,hasBlank=false,tmp = this.T(this.nums,1);
            this.nums.forEach((i,j)=>{
                if(!i || this.nums[j-4] == i || this.nums[j+4] == i || tmp[j-4] == tmp[j] || tmp[j+4] == tmp[j]){
                    isOver = false;
                }
                if(i==2048 && !this.pass){
                    this.msg = "2048";
                    this.show = 1;           
                    //确保只提示一次 达到2048仍可以继续玩
                    this.pass = true;
                }
            });
            if(isOver){
                this.msg = "Game Over";
                this.show = 1;
            }
        }
    }
}
</script>

<style>
    @import url(./main.css);
</style>