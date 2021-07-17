<template>
  <div id="app">
    <div class="grid">
      <el-row v-for="rowIndex in 12" :key="rowIndex">
        <el-col :span="2" v-for="colIndex in 12" :key="colIndex">
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
        </el-col>
      </el-row>
    </div>

    <div class="padding">
      <el-form inline>
        <el-form-item>
          <el-button type="primary" size="small" @click="download">下载</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="clear">清空</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="setWord" :disabled="!isExists">换词</el-button>
        </el-form-item>
        <el-form-item>
          <el-select size="small" v-model="value" @change="onWordChange">
            <el-option v-for="(item, key) in optionalWords" :key="key" :label="item.word" :value="item.word">
              <span style="float: left">{{ item.word }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">{{ item.rate }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="__removeNode" :disabled="!isExists">删除</el-button>
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

export default {
  name: 'App',
  components: { VCell },
  data () {
    return {
      isSelect: false,

      current_selections: [],

      grid: [],

      value: '',
    };
  },

  computed: {
    usedWords () {
      return this.grid.map(t => t.word);
    },

    // 过滤已使用的成语后的列表
    idioms () {
      return ClearIdioms.filter(t => !this.usedWords.includes(t.word));
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

      console.log('#getReference', this.getOtherNode);
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
      return this.idioms.filter(idiom => {
        const letters = idiom.word.split('');
        return this.getReference.every((value, index) => {
          if (!value) {
            return true;
          }
          return value === letters[index];
        });
      });
    }
  },

  watch: {
    getCurrentSelections () {
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
      // console.log('#mousemove', e, diff);
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
      if (!word) {
        return;
      }

      const { rowIndex, colIndex } = this.getCurrentSelections[0];
      // console.log('__addNode', JSON.parse(JSON.stringify(this.grid)), rowIndex, colIndex);
      const index = this.grid.findIndex(t => t.rowIndex === rowIndex && t.colIndex === colIndex);
      if (index === -1) {
        this.grid.push({
          word,
          rowIndex,
          colIndex,
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
      // console.log('__removeNode', JSON.parse(JSON.stringify(this.grid)), rowIndex, colIndex);
      const index = this.grid.findIndex(t => t.rowIndex === rowIndex && t.colIndex === colIndex);
      if (index !== -1) {
        this.grid.splice(index, 1);
        this.current_selections = [];
      }
    },

    __updateNode (word) {
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
     * 随机获取一个有效成语
     * @returns {null|*}
     */
    getRandomWord () {
      if (this.getCurrentSelections.length !== 4) {
        return null;
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
      console.log('#canConnIdioms', canConnIdioms.length);

      if (canConnIdioms.length) {
        return canConnIdioms.random().word;
      } else {
        return null;
      }
    },

    /**
     * 在选择的位置填充成语
     */
    setWord () {
      console.log('#setWords', this.getReference);

      let word = this.getRandomWord();
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
      console.log('#onWordChange', word);
      this.__updateNode(word);
    },

    /**
     * 下载文件
     */
    download () {
      const blob = new Blob([JSON.stringify(this.grid, null, 2)],{type:'application/json,charset=utf-8;'});
      FileSaver.saveAs(blob, `level.json`);
    },

    /**
     * 清空网格
     */
    clear () {
      this.current_selections = [];
      this.grid = [];
    },
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
}

.grid-item {
  width: 60px;
  height: 60px;
  border-style: solid;
  border-color: #222424;
  border-width: 0 1px 1px 0;
}

.padding {
  padding: 20px;
}
</style>
