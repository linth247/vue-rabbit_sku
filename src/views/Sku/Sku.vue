<script setup>
import { onMounted, ref } from 'vue'
import axios from 'axios'
import powerSet from './power-set'

// 商品數據
const goods = ref({})
let pathMap = {}
const getGoods = async () => {
  // 1135076  初始化就有無庫存的規格
  // 1369155859933827074 更新之後有無庫存項（藍色-20cm-中國）
  const res = await axios.get('http://pcapi-xiaotuxian-front-devtest.itheima.net/goods?id=1369155859933827074')
  // const res = await axios.get('http://pcapi-xiaotuxian-front-devtest.itheima.net/goods?id=1135076')
  goods.value = res.data.result
  pathMap = getPathMap(goods.value)
  console.log(pathMap)
  initDisabledStatus(goods.value.specs, pathMap)
}
onMounted(() => getGoods())

// 切換選中狀態
// 選中與取消選中實現
const changeSelectedStatus = (item, val) => {
  if(val.disabled) return
  // 點擊的是未選中，把同一個規格的其他取消選中，當前點擊項選中，點擊的是已選中，直接取消
  // item: 同一排的對象
  // val: 當前點擊項
  if (val.selected) {
    val.selected = false // 取消激活
  } else {
    // 同排取消
    item.values.forEach(valItem => valItem.selected = false)
    // 當前選中
    val.selected = true
  }
  // const arr = getSelectedValues(goods.value.specs)
  // console.log(arr)
  // 點擊按鈕時更新
  updateDisabledStatus(goods.value.specs, pathMap)
  // 產出SKU對象數據
  const index = getSelectedValues(goods.value.specs).findIndex(item => item === undefined)
  if(index > -1) {
    console.log('找到了，信息不完整')
  }else{
    console.log('沒有找到，信息完整，可以產出')
    // 獲取sku對象
    const key = getSelectedValues(goods.value.specs).join('-')
    console.log(key)
    const skuIds = pathMap[key]
    console.log(skuIds)
    // 以skuId作為匹配項去goods.value.skus數組中找
    const skuObj = goods.value.skus.find(item => item.id === skuIds[0])
    console.log('sku對象為', skuObj)
  }
}

// 生成有效路徑字典(2)
//               實現步驟：
//               1.根據庫存字段，得到有效的SKU數組
//               2.根據有效的SKU數組，使用powerSet算法，得到所有子集
//               3.根據子集生成路徑字典對象

//生成有效路徑字典對象
const getPathMap = (goods) => {
  const pathMap = {}
  // 1.根據skus字段，生成有效的sku數組
  const effectiveSkus = goods.skus.filter(sku => sku.inventory > 0)

  // 2.根據有效的sku使用算法(子集算法) [1,2] => [[1],[2],[1,2]]
  effectiveSkus.forEach(sku=> {
    // 2.1 獲取匹配的valueName組成的數組
    const selectedValArr = sku.specs.map(val => val.valueName)
    // 2.2 使用算法獲取子集
    const valueArrPowerSet = powerSet(selectedValArr)
    // 3. 把得到子集生成最終的路徑字典對象
    valueArrPowerSet.forEach(arr=>{
      // 初始化key 數組join-> 字符串 對象的key
      const key = arr.join('-')
      // 如果已經存在當前key了，就往數組中直接添加skuId 如果不存在key 直接就賦值
      if(getPathMap[key]){
        pathMap[key].push(sku.id)
      }else{
        pathMap[key] = [sku.id]
      }
    })
  })
  return pathMap
}

// 初始化禁用狀態
const initDisabledStatus = (specs, pathMap) => {
  specs.forEach(spec => {
    spec.values.forEach(val => {
      if(pathMap[val.name]){
        val.disabled = false
      }else{
        val.disabled = true
      }
    })
  })
}

// 獲取選中項的匹配數組
const getSelectedValues = (specs) => {
  const arr = []
  specs.forEach(spec => {
    // 目標：找到values中selected為true的項，然後把它的name字段，添加數組對應的位置
    const selectedVal = spec.values.find(item => item.selected)
    arr.push(selectedVal? selectedVal.name: undefined)
  })
  return arr
}

// 切換時，更新禁用狀態
const updateDisabledStatus = (specs, pathMap) => {
  specs.forEach((spec, index) => {
    const selectedValues = getSelectedValues(specs)
    spec.values.forEach(val => {
      selectedValues[index] = val.name
      const key = selectedValues.filter(value => value).join('-')
      if(pathMap[key]){
        val.disabled = false
      }else{
        val.disabled = true
      }
    })
  })
}

</script>

<template>
  <div class="goods-sku">
    <dl v-for="item in goods.specs" :key="item.id">
      <dt>{{ item.name }}</dt>
      <dd>
        <template v-for="val in item.values" :key="val.name">
          <!-- 圖片類型規格 -->
          <img :class="{selected: val.selected, disabled:val.disabled}" @click="changeSelectedStatus(item, val)" 
            v-if="val.picture" :src="val.picture" :title="val.name">
          <!-- 文字類型規格 -->
          <span :class="{selected: val.selected, disabled:val.disabled}" 
            v-else @click="changeSelectedStatus(item, val)">{{ val.name }}</span>
        </template>
      </dd>
    </dl>
  </div>
</template>

<style scoped lang="scss">
@mixin sku-state-mixin {
  border: 1px solid #e4e4e4;
  margin-right: 10px;
  cursor: pointer;

  &.selected {
    border-color: #27ba9b;
  }

  &.disabled {
    opacity: 0.6;
    border-style: dashed;
    cursor: not-allowed;
  }
}

.goods-sku {
  padding-left: 10px;
  padding-top: 20px;

  dl {
    display: flex;
    padding-bottom: 20px;
    align-items: center;

    dt {
      width: 50px;
      color: #999;
    }

    dd {
      flex: 1;
      color: #666;

      >img {
        width: 50px;
        height: 50px;
        margin-bottom: 4px;
        @include sku-state-mixin;
      }

      >span {
        display: inline-block;
        height: 30px;
        line-height: 28px;
        padding: 0 20px;
        margin-bottom: 4px;
        @include sku-state-mixin;
      }
    }
  }
}
</style>