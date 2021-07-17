<template>
  <div :style="cellStyle" @mousedown="mousedown" @mouseup="mouseup" @mousemove="mousemove">{{ word }}</div>
</template>

<script>
export default {
  name: 'v-cell',
  props: {
    rowIndex: {
      type: Number,
      required: true
    },
    colIndex: {
      type: Number,
      required: true
    },
    selections: {
      type: Array,
      required: true
    },
    current: {
      type: Array,
      required: true
    },
    word: {
      type: String,
      default: ''
    }
  },

  data () {
    return {
      isMouseDown: false,
      isMouseMove: false
    }
  },

  computed: {
    cellStyle () {
      const hasSelf = this.selections.find(t => t.rowIndex === this.rowIndex && t.colIndex === this.colIndex);
      const hasCurrentSelf = this.current.find(t => t.rowIndex === this.rowIndex && t.colIndex === this.colIndex);
      return {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: hasCurrentSelf ? '#94d777' : hasSelf ? '#d29292' : '',
      }
    },

    values () {
      return {
        ...this.$props
      };
    }
  },

  methods: {
    mousedown () {
      this.isMouseDown = true;
      this.$emit('mousedown', this.values);
    },

    mouseup () {
      this.isMouseDown = false;
      this.$emit('mouseup', this.values);
    },

    mousemove () {
      this.$emit('mousemove', this.values);
    }
  }
};
</script>

<style scoped>

</style>
