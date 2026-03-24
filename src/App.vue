<template>
  <div class="app-container">
    <MenuBar />
    <div class="main-content">
      <Toolbar />
      <div class="center-area">
        <Canvas />
        <PageManager />
      </div>
      <PropertyPanel />
    </div>
    <StatusBar />
  </div>
</template>

<script setup lang="ts">
import MenuBar from './components/layout/MenuBar.vue'
import Toolbar from './components/layout/Toolbar.vue'
import Canvas from './components/layout/Canvas.vue'
import PropertyPanel from './components/layout/PropertyPanel.vue'
import PageManager from './components/layout/PageManager.vue'
import StatusBar from './components/layout/StatusBar.vue'
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #1e1e1e;
  color: #fff;
  overflow: hidden;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.center-area {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}
</style>
