<template>
  <div id="app">
    <el-form inline>
      <el-form-item label="词库">
        <el-select size="small" v-model="selectIdiom">
          <el-option key="idiom.clear" label="idiom.clear" value="idiom.clear" />
          <el-option key="idiom.clear.fill" label="idiom.clear.fill" value="idiom.clear.fill" />
        </el-select>
      </el-form-item>
      <el-form-item label="最小成语数">
        <el-select size="small" v-model="minIdiom">
          <el-option key="8" label="8" :value="8" />
          <el-option key="9" label="9" :value="9" />
          <el-option key="10" label="10" :value="10" />
          <el-option key="11" label="11" :value="11" />
          <el-option key="12" label="12" :value="12" />
          <el-option key="13" label="13" :value="13" />
        </el-select>
      </el-form-item>
    </el-form>

    <div class="grid">
      <div class="grid-row" v-for="rowIndex in 12" :key="rowIndex" :data-row="rowIndex">
        <div class="grid-col" v-for="colIndex in 12" :key="colIndex" :data-col="colIndex">
          <v-cell class="grid-item"
                  :row-index="rowIndex"
                  :col-index="colIndex"
                  :selections="getGridAxis"
                  :current="current_selections"
                  :word="getWordByAxis(rowIndex, colIndex)"
                  @mousedown="__mousedown"
                  @mouseup="__mouseup"
                  @mousemove="__mousemove"
          >
          </v-cell>
        </div>
      </div>
    </div>

    <div class="padding">
      <el-form inline>
        <el-form-item>
          <el-button type="danger" size="small" @click="clearStorage">清除缓存</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="download" :disabled="grid.length < rawMinIdiom">下载</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="clear">清空</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="setWord(true)" :disabled="!isExists">换词</el-button>
        </el-form-item>
        <el-form-item>
          <el-select size="small" v-model="value" @change="onWordChange">
            <el-option v-for="(item, key) in optionalWords" :key="key" :label="item.word" :value="item.word">
              <span style="float: left">{{ item.word }}</span>
              <span style="float: left">({{ item.count }})</span>
              <span style="float: right; color: #8492a6; font-size: 13px">{{ item.reference }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="danger" size="small" @click="__removeNode" :disabled="!isExists">删除</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>

import VCell from '@/components/cell';

import _ from 'lodash';
import FileSaver from 'file-saver';
import ClearIdioms from './data/idiom.clear.json';
import ClearFillIdioms from './data/idiom.clear.fill.json';

import { getLocalStorage, setLocalStorage } from '@/utils/storage';
import { jsonParse, jsonStringify } from '@/utils';

const KEY_IDIOM_USED_COUNT = '__idiom_used_count__';
const KEY_IDIOM_LEVEL_NUMBER = '__idiom_level_number__';
const KEY_IDIOM_MIN_NUMBER = '__idiom_min_number__';

export default {
  name: 'App',
  components: { VCell },
  data () {
    return {
      selectIdiom: 'idiom.clear',

      isSelect: false,

      current_selections: [],

      grid: [],

      value: '',

      rawGridStorage: jsonParse(getLocalStorage(KEY_IDIOM_USED_COUNT), {}),

      levelNumber: parseInt(getLocalStorage(KEY_IDIOM_LEVEL_NUMBER) || '1'),

      rawMinIdiom: parseInt(getLocalStorage(KEY_IDIOM_MIN_NUMBER) || '8'),
    };
  },

  computed: {
    usedWords () {
      return this.grid.map(t => t.word);
    },

    // 过滤已使用的成语后的列表
    idioms () {
      if (this.selectIdiom === 'idiom.clear') {
        return ClearIdioms.filter(t => t.word === this.value || !this.usedWords.includes(t.word)).map(t => {
          return {
            ...t,
            count: this.gridStorage[t.word] || 0,
          }
        });
      } else {
        return ClearFillIdioms.filter(t => t.word === this.value || !this.usedWords.includes(t.word)).map(t => {
          return {
            ...t,
            count: this.gridStorage[t.word] || 0,
          }
        });
      }
    },

    // 当前选中网格方向
    isSelectVertical () {
      if (this.current_selections.length < 2) {
        return false;
      }

      return this.current_selections[0].colIndex === this.current_selections[1].colIndex;
    },

    // 当前选择的网格并排序
    getCurrentSelections () {
      return _.orderBy([...this.current_selections], ['rowIndex', 'colIndex'], ['asc', 'asc']);
    },

    getCurrentNode () {
      if (this.getCurrentSelections.length !== 4) {
        return false;
      }

      const start = this.getCurrentSelections[0];
      return this.grid.find(t => t.rowIndex === start.rowIndex && t.colIndex === start.colIndex && t.vertical === this.isSelectVertical);
    },

    isExists () {
      return !!this.getCurrentNode;
    },

    getOtherNode () {
      if (this.getCurrentSelections.length !== 4) {
        return [];
      }

      if (!this.getCurrentNode) {
        return this.grid;
      }

      return this.grid.filter(t => t.word !== this.getCurrentNode.word);
    },

    getGridAxis () {
      return _.flattenDeep(this.grid.map(t => t.axis)).map(t => {
        const [rowIndex, colIndex] = ('' + t).split('_').map(t => parseInt(t));
        return { rowIndex, colIndex };
      });
    },

    // 参考词列表（用于连接）
    getReference () {
      if (this.getCurrentSelections.length !== 4) {
        return [];
      }

      return this.getCurrentSelections.map(t => {
        return this.getOtherNode.reduce((word, node) => {
          const index = node.axis.indexOf(`${t.rowIndex}_${t.colIndex}`);
          if (index !== -1) {
            return node.word.split('')[index];
          } else {
            return word;
          }
        }, '');
      })
    },

    // 可选成语列表
    optionalWords () {
      if (this.getCurrentSelections.length !== 4) {
        return [];
      }

      if (this.isSelect) {
        return [];
      }

      const hasRef = this.getReference.some(word => !!word);
      if (!hasRef) {
        return [];
      }

      return this.getRandomWords();
    },

    gridStorage: {
      get () {
        return this.rawGridStorage;
      },
      set (grid = []) {
        // const storage = jsonParse(getLocalStorage('KEY_IDIOM_USED_COUNT'), {});

        grid.forEach(item => {
          const key = item.word;
          // console.log(storage, storage[key]);
          if (!this.rawGridStorage[key]) {
            this.rawGridStorage[key] = 0;
          }
          this.rawGridStorage[key]++;
        });

        setLocalStorage(KEY_IDIOM_USED_COUNT, jsonStringify(this.rawGridStorage, {}));
      }
    },

    levelStorage: {
      get () {
        return this.levelNumber;
      },
      set () {
        this.levelNumber++;
        setLocalStorage(KEY_IDIOM_LEVEL_NUMBER, (this.levelNumber).toString());
      }
    },

    minIdiom: {
      get () {
        return this.rawMinIdiom;
      },
      set (val) {
        this.rawMinIdiom = val;
        setLocalStorage(KEY_IDIOM_MIN_NUMBER, (this.rawMinIdiom).toString());
      }
    },
  },

  watch: {
    getCurrentNode () {
      if (this.getCurrentNode) {
        this.value = this.getCurrentNode.word;
      } else {
        this.value = '';
      }
    }
  },

  methods: {
    __mousedown () {
      this.current_selections = [];
      this.isSelect = true;
    },

    __mouseup () {
      this.isSelect = false;

      this.setWord();
    },

    __mousemove: _.debounce(function (e) {
      if (!this.isSelect) {
        return;
      }

      if (_.find(this.current_selections, t => t.rowIndex === e.rowIndex && t.colIndex === e.colIndex)) {
        return;
      }

      // first
      if (this.current_selections.length === 0) {
        this.current_selections.push(e);
        return;
      }

      // second
      const last = this.current_selections[this.current_selections.length - 1];
      if (this.current_selections.length === 1) {
        if ((last.colIndex === e.colIndex || last.rowIndex === e.rowIndex) && (Math.abs(last.rowIndex - e.rowIndex) === 1 || Math.abs(last.colIndex - e.colIndex) === 1)) {
          this.current_selections.push(e);
        }

        return;
      }

      // other
      const diff = this.isSelectVertical ? Math.abs(last.rowIndex - e.rowIndex) : Math.abs(last.colIndex - e.colIndex);
      if (diff !== 1) {
        return;
      }

      if (this.isSelectVertical && last.colIndex === e.colIndex) {
        this.current_selections.push(e);
      } else if (!this.isSelectVertical && last.rowIndex === e.rowIndex) {
        this.current_selections.push(e);
      }
    }, 10),

    /**
     * 添加成语节点
     * @param word
     * @private
     */
    __addNode (word) {
      if (!this.isExists && word) {
        this.grid.push({
          word,
          rowIndex: this.getCurrentSelections[0].rowIndex,
          colIndex: this.getCurrentSelections[0].colIndex,
          vertical: this.isSelectVertical,
          axis: this.getCurrentSelections.map(t => `${t.rowIndex}_${t.colIndex}`),
        });
      }
    },

    /**
     * 删除成语节点
     * @private
     */
    __removeNode () {
      if (this.getCurrentSelections.length !== 4) {
        return;
      }

      const { rowIndex, colIndex } = this.getCurrentSelections[0];
      const index = this.grid.findIndex(t => t.rowIndex === rowIndex && t.colIndex === colIndex);
      if (index !== -1) {
        this.grid.splice(index, 1);
        this.current_selections = [];
      }
    },

    __updateNode (word) {
      if (!this.isExists || !word) {
        return;
      }
      for (let i = 0; i < this.grid.length; i++) {
        const node = this.grid[i];
        if (node.vertical === this.isSelectVertical && node.rowIndex === this.getCurrentNode.rowIndex && node.colIndex === this.getCurrentNode.colIndex) {
          this.$set(node, 'word', word);
        }
      }
    },

    /**
     * 按坐标获取所属节点
     * @param rowIndex
     * @param colIndex
     * @returns {*}
     * @private
     */
    __getNodeByAxis (rowIndex, colIndex) {
      return this.grid.find(t => t.axis.includes(`${rowIndex}_${colIndex}`));
    },

    /**
     * 获取坐标节点文字
     * @param rowIndex
     * @param colIndex
     * @returns {string}
     */
    getWordByAxis (rowIndex, colIndex) {
      const node = this.__getNodeByAxis(rowIndex, colIndex);
      if (node) {
        return node.word.split('')[node.axis.indexOf(`${rowIndex}_${colIndex}`)];
      }
      return '';
    },

    /**
     * 获取一组有效成语
     * @returns []
     */
    getRandomWords () {
      if (this.getCurrentSelections.length !== 4) {
        return [];
      }

      const canConnIdioms = this.idioms.filter(idiom => {
        const letters = idiom.word.split('');
        return this.getReference.every((value, index) => {
          if (!value) {
            return true;
          }
          return value === letters[index];
        });
      });

      return Object.freeze(_.orderBy(canConnIdioms, ['count', 'rate', 'reference'], ['asc', 'desc', 'desc']).slice(0, 1000));
    },

    /**
     * 在选择的位置填充成语
     * @package isClick
     */
    setWord (isClick = false) {
      // console.log('#setWords', this.getReference);

      if (this.isExists && !isClick) {
        return;
      }
      const words = this.getRandomWords();
      // console.log(JSON.parse(JSON.stringify(words)));
      let word = words.length && words.random().word;
      if (!word) {
        return;
      }

      if (this.isExists) {
        this.__updateNode(word);
      } else {
        this.__addNode(word);
      }
    },

    onWordChange (word) {
      if (this.isExists) {
        this.__updateNode(word);
      } else {
        this.__addNode(word);
      }
    },

    /**
     * 下载文件
     */
    download: _.debounce(function () {
      const data = this.grid.map(t => _.omit(t, ['axis']));
      this.gridStorage = data;
      const blob = new Blob([JSON.stringify(data, null, 2)],{type:'application/json,charset=utf-8;'});
      FileSaver.saveAs(blob, `level.${this.levelStorage}.json`);
      this.levelStorage++;
    }, 300),

    /**
     * 清空网格
     */
    clear () {
      this.current_selections = [];
      this.grid = [];
    },

    clearStorage () {
      this.$confirm('确认清除缓存?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        center: true
      }).then(() => {
        setLocalStorage(KEY_IDIOM_USED_COUNT, JSON.stringify({}));
        setLocalStorage(KEY_IDIOM_LEVEL_NUMBER, 1);
        this.$message({
          type: 'success',
          message: '清除成功!'
        });
      });
    }
  }
}
</script>

<style>
html, body {
  user-select: none;
}

#app {
  position: relative;
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.grid {
  border-style: solid;
  border-color: #222424;
  border-width: 1px 0 0 1px;

  margin: 40px 0;
  width: calc(100vh / 2);
  height: calc(100vh / 2);
  display: flex;
  flex-direction: column;
}

.grid-row {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: row;
}

.grid-row::before, .grid-row::after {
  content: attr(data-row);
  position: absolute;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0;
  bottom: 0;
}

.grid-row::before {
  left: -40px;
}

.grid-row::after {
  right: -40px;
}

.grid-col {
  position: relative;
  flex: 1;
  padding: 1px;
  border-style: solid;
  border-color: #222424;
  border-width: 0 1px 1px 0;
}

.grid-row:first-child .grid-col::before,
.grid-row:last-child .grid-col::after {
  content: attr(data-col);
  position: absolute;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  left: 0;
  right: 0;
}

.grid-row:first-child .grid-col::before {
  top: -40px;
}

.grid-row:last-child .grid-col::after {
  bottom: -40px;
}

.grid-item {
  width: 100%;
  height: 100%;
}

.padding {
  padding: 20px;
}
</style>
