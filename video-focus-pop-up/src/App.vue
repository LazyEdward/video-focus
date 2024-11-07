<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'
  import SubTitleExpandable from './components/SubTitleExpandable.vue'
  import SwitchListItem from './components/SwitchListItem.vue'
  import SelectListItem from './components/SelectListItem.vue'
  import CounterListItem from './components/CounterListItem.vue'
  import LinkItem from './components/LinkItem.vue'
  import LoadingOverlay from './components/LoadingOverlay.vue'

  type TVideoFocusReadStorage = {
    "video-focus.paused": boolean,
    "video-focus.tabPauseMapping": Record<number,boolean>,
    "video-focus.activeTab": number,
    "video-focus.trackingAvailable": boolean,
    "video-focus.defaultDetector": string,
    "video-focus.inputSize": number,
    "video-focus.scoreThreshold": number,
    "video-focus.minConfidence": number,
    "video-focus.enableFaceTrackng": boolean,
    "video-focus.enableFaceTrackngFullScreenOnly": boolean,
    "video-focus.autoPlay": boolean,
    "video-focus.autoPauseOnFullScreenChange": boolean,
    "video-focus.autoPauseOnSwitchTab": boolean,
    "video-focus.autoResume": boolean,
  }

  type TVideoFocusUpdateStorage = {
    "video-focus.paused": boolean,
    "video-focus.tabPauseMapping": Record<number,boolean>,
    "video-focus.trackingAvailable": boolean,
    "video-focus.defaultDetector": string,
    "video-focus.inputSize": number,
    "video-focus.scoreThreshold": number,
    "video-focus.minConfidence": number,
    "video-focus.enableFaceTrackng": boolean,
    "video-focus.enableFaceTrackngFullScreenOnly": boolean,
    "video-focus.autoPlay": boolean,
    "video-focus.autoPauseOnFullScreenChange": boolean,
    "video-focus.autoPauseOnSwitchTab": boolean,
    "video-focus.autoResume": boolean,
  }

  const DETECTOR_OPTIONS = ["tiny_face", "ssd"]
  const DETECTOR_OPTIONS_NAME: { [ k: string] : string } = {"tiny_face": "Tiny Face", "ssd": "SSD Mobilenet"}
  const FACE_TRACKING_INPUT_SIZE_OPTIONS = [128, 160, 224, 320, 416, 512, 608]

  const loading = ref(false)
  const hasChange = ref(false)

  const disableOnThisTab = ref(false)

  const paused = ref(false)
  const activeTab = ref(-1)
  const tabPauseMapping = ref<Record<string,boolean>>({})
  const trackingAvailable = ref(false)
  const defaultDetector = ref('tiny_face')
  const inputSize = ref(224)
  const scoreThreshold = ref(0.5)
  const minConfidence = ref(0.5)
  const enableFaceTrackng = ref(false)
  const enableFaceTrackngFullScreenOnly = ref(true)
  const autoPlay = ref(false)
  const autoPauseOnFullScreenChange = ref(true)
  const autoPauseOnSwitchTab = ref(true)
  const autoResume = ref(true)
  const faceDetectionFocus = ref(false)

  const requestDebugPage = () : Promise<void> => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: 'requestDebugPage',
        target: 'video-focus.requestDebugPage',
        data: ''
      }).then(() => resolve())
    })
  }

  const setVideoFocusStorage = (settings: TVideoFocusUpdateStorage) : Promise<void> => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: 'settings',
        target: 'video-focus.updateSettings',
        data: JSON.stringify(settings)
      }).then(() => resolve())
    })
  }

  const getVideoFocusStorage = () : Promise<TVideoFocusReadStorage | null> => {
    return new Promise((resolve) => {
      chrome.storage.local.get([
        'video-focus.paused',
        'video-focus.tabPauseMapping',
        'video-focus.activeTab',
        'video-focus.trackingAvailable',
        "video-focus.defaultDetector",
        'video-focus.inputSize',
        'video-focus.scoreThreshold',
        "video-focus.minConfidence",
        'video-focus.enableFaceTrackng',
        'video-focus.enableFaceTrackngFullScreenOnly',
        'video-focus.autoPlay',
        'video-focus.autoPauseOnFullScreenChange',
        'video-focus.autoPauseOnSwitchTab',
        'video-focus.autoResume',
      ]).then((storage) => {
        if(chrome.runtime.lastError)
          console.log(`chrome.storage.local: ${chrome.runtime.lastError.message}`);

        resolve(storage ? {
          'video-focus.paused': storage['video-focus.paused'],
          'video-focus.tabPauseMapping': storage['video-focus.tabPauseMapping'],
          'video-focus.activeTab': storage['video-focus.activeTab'],
          'video-focus.trackingAvailable': storage['video-focus.trackingAvailable'],
          "video-focus.defaultDetector": storage['video-focus.defaultDetector'],
          'video-focus.inputSize': storage['video-focus.inputSize'],
          'video-focus.scoreThreshold': storage['video-focus.scoreThreshold'],
          "video-focus.minConfidence": storage['video-focus.minConfidence'],
          'video-focus.enableFaceTrackng': storage['video-focus.enableFaceTrackng'],
          'video-focus.enableFaceTrackngFullScreenOnly': storage['video-focus.enableFaceTrackngFullScreenOnly'],
          'video-focus.autoPlay': storage['video-focus.autoPlay'],
          'video-focus.autoPauseOnFullScreenChange': storage['video-focus.autoPauseOnFullScreenChange'],
          'video-focus.autoPauseOnSwitchTab': storage['video-focus.autoPauseOnSwitchTab'],
          'video-focus.autoResume': storage['video-focus.autoResume'],
        }: null)
      })
    })
  }

  const videoFocusStorageListener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
    if(changes['video-focus.faceDetectionFocus'] !== undefined){
      faceDetectionFocus.value = changes['video-focus.faceDetectionFocus'].newValue;
    }
    if(changes['video-focus.tabPauseMapping'] !== undefined || changes['video-focus.activeTab'] !== undefined){
      if(changes['video-focus.tabPauseMapping'] !== undefined)
        tabPauseMapping.value = changes['video-focus.tabPauseMapping'].newValue;
      if(changes['video-focus.activeTab'] !== undefined)
        activeTab.value = changes['video-focus.activeTab'].newValue;
      
      disableOnThisTab.value = !!tabPauseMapping.value[``+activeTab.value]
    }

    if(changes['video-focus.trackingAvailable'] !== undefined){
      trackingAvailable.value = changes['video-focus.trackingAvailable'].newValue;
    }
  }

  const setHasChange = (callback: () => void) => {
    callback()
    hasChange.value = true;
  }

  const refresh = async() => {
    loading.value = true;

    let settings = await getVideoFocusStorage();

    if(settings){
      paused.value = settings?.['video-focus.paused'] !== undefined ? settings['video-focus.paused'] : paused.value
      activeTab.value = settings?.['video-focus.activeTab'] !== undefined ? settings['video-focus.activeTab'] : activeTab.value
      tabPauseMapping.value = settings?.['video-focus.tabPauseMapping'] !== undefined ? settings['video-focus.tabPauseMapping'] : tabPauseMapping.value
      trackingAvailable.value = settings?.['video-focus.trackingAvailable'] !== undefined ? settings['video-focus.trackingAvailable'] : trackingAvailable.value
      defaultDetector.value = settings?.['video-focus.defaultDetector'] !== undefined ? settings['video-focus.defaultDetector'] : defaultDetector.value
      inputSize.value = settings?.['video-focus.inputSize'] !== undefined ? settings['video-focus.inputSize'] : inputSize.value
      scoreThreshold.value = settings?.['video-focus.scoreThreshold'] !== undefined ? settings['video-focus.scoreThreshold'] : scoreThreshold.value
      minConfidence.value = settings?.['video-focus.minConfidence'] !== undefined ? settings['video-focus.minConfidence'] : minConfidence.value
      enableFaceTrackng.value = settings?.['video-focus.enableFaceTrackng'] !== undefined ? settings['video-focus.enableFaceTrackng'] : enableFaceTrackng.value
      enableFaceTrackngFullScreenOnly.value = settings?.['video-focus.enableFaceTrackngFullScreenOnly'] !== undefined ? settings['video-focus.enableFaceTrackngFullScreenOnly'] : enableFaceTrackngFullScreenOnly.value
      autoPlay.value = settings?.['video-focus.autoPlay'] ? settings['video-focus.autoPlay'] !== undefined : autoPlay.value
      autoPauseOnFullScreenChange.value = settings?.['video-focus.autoPauseOnFullScreenChange'] !== undefined ? settings['video-focus.autoPauseOnFullScreenChange'] : autoPauseOnFullScreenChange.value
      autoPauseOnSwitchTab.value = settings?.['video-focus.autoPauseOnSwitchTab'] !== undefined ? settings['video-focus.autoPauseOnSwitchTab'] : autoPauseOnSwitchTab.value
      autoResume.value = settings?.['video-focus.autoResume'] !== undefined ? settings['video-focus.autoResume'] : autoResume.value

      disableOnThisTab.value = !!tabPauseMapping.value[``+activeTab.value]
    }

    hasChange.value = false;
    loading.value = false;
  }

  const updateSetting = async() => {
    loading.value = true;

    console.log({
      'video-focus.paused': paused.value,
      'video-focus.activeTab': activeTab.value,
      'video-focus.tabPauseMapping': tabPauseMapping.value,
      'video-focus.trackingAvailable': trackingAvailable.value,
      'video-focus.defaultDetector': defaultDetector.value,
      'video-focus.inputSize': inputSize.value,
      'video-focus.scoreThreshold': scoreThreshold.value,
      'video-focus.minConfidence': minConfidence.value,
      'video-focus.enableFaceTrackng': enableFaceTrackng.value,
      'video-focus.enableFaceTrackngFullScreenOnly': enableFaceTrackngFullScreenOnly.value,
      'video-focus.autoPlay': autoPlay.value,
      'video-focus.autoPauseOnFullScreenChange': autoPauseOnFullScreenChange.value,
      'video-focus.autoPauseOnSwitchTab': autoPauseOnSwitchTab.value,
      'video-focus.autoResume': autoResume.value,
    })

    let updateTabPauseMapping = {...tabPauseMapping.value}

    if(disableOnThisTab.value){
      if(!tabPauseMapping.value[``+activeTab.value])
        updateTabPauseMapping[``+activeTab.value] = true
    }
    else{
      if(tabPauseMapping.value[``+activeTab.value]){
        updateTabPauseMapping[``+activeTab.value] = false
      }
    }

    await setVideoFocusStorage({
        'video-focus.paused': paused.value,
        'video-focus.tabPauseMapping': updateTabPauseMapping,
        'video-focus.trackingAvailable': trackingAvailable.value,
        'video-focus.defaultDetector': defaultDetector.value,
        'video-focus.inputSize': inputSize.value,
        'video-focus.scoreThreshold': scoreThreshold.value,
        'video-focus.minConfidence': minConfidence.value,
        'video-focus.enableFaceTrackng': enableFaceTrackng.value,
        'video-focus.enableFaceTrackngFullScreenOnly': enableFaceTrackngFullScreenOnly.value,
        'video-focus.autoPlay': autoPlay.value,
        'video-focus.autoPauseOnFullScreenChange': autoPauseOnFullScreenChange.value,
        'video-focus.autoPauseOnSwitchTab': autoPauseOnSwitchTab.value,
        'video-focus.autoResume': autoResume.value,
      });

    hasChange.value = false;
    loading.value = false;
  }

  const onRequestDebugPage = async() => {
    loading.value = true;
    await requestDebugPage()
    loading.value = false;
  }

  onMounted(async() => {
    await refresh();
    chrome.storage.onChanged.addListener(videoFocusStorageListener)
  })

  onUnmounted(() => {
    chrome.storage.onChanged.removeListener(videoFocusStorageListener)
  })

</script>

<template>
  <div class="layout">
    <LoadingOverlay :show="loading"/>
    <div class="header"> Video Focus Settings </div>
    <div class="settings">
      <SwitchListItem
        name="Disable all features"
        :value="paused"
        :change="(value) => setHasChange(() => paused = value)"
      />
      <SubTitleExpandable
        v-if="activeTab !== -1"
        name="Local Setting"
      >
        <SwitchListItem
          name="Disable on current tab"
          :value="disableOnThisTab"
          :change="(value) => setHasChange(() => disableOnThisTab = value)"
        />
      </SubTitleExpandable>
      <SubTitleExpandable
        name="Play Setting"
      >
        <SwitchListItem
          name="Video autoplay"
          :disabled="paused"
          :value="autoPlay"
          :change="(value) => setHasChange(() => autoPlay = value)"
        />
        <SwitchListItem
          name="Pause video on Exit FullScreen"
          :disabled="paused"
          :value="autoPauseOnFullScreenChange"
          :change="(value) => setHasChange(() => autoPauseOnFullScreenChange = value)"
        />
        <SwitchListItem
          name="Pause video on Tab loss focus"
          :disabled="paused"
          :value="autoPauseOnSwitchTab"
          :change="(value) => setHasChange(() => autoPauseOnSwitchTab = value)"
        />
      </SubTitleExpandable>
      <SubTitleExpandable
        name="Face Tracking Setting"
      >
        <div class="tracking-container">
          <span class="tracking-status" :class="{ 'tracking-status-active': faceDetectionFocus}"/>
          <SwitchListItem
            name="Enable Tracking"
            :disabled="paused"
            :value="enableFaceTrackng"
            :change="(value) => setHasChange(() => enableFaceTrackng = value)"
          />
        </div>
        <LinkItem
          name="Open debug page"
          :disabled="hasChange || paused || !enableFaceTrackng"
          :open="onRequestDebugPage"
        />
        <SwitchListItem
          name="In Full Screen Only"
          :disabled="paused || !enableFaceTrackng"
          :value="enableFaceTrackngFullScreenOnly"
          :change="(value) => setHasChange(() => enableFaceTrackngFullScreenOnly = value)"
        />
        <SwitchListItem
          name="Auto resume video"
          :disabled="paused || !enableFaceTrackng"
          :value="autoResume"
          :change="(value) => setHasChange(() => autoResume = value)"
        />
        <SelectListItem
          name="Detector Option"
          :disabled="paused || !enableFaceTrackng"
          :value="defaultDetector"
          :options="DETECTOR_OPTIONS.map(v => ({label: DETECTOR_OPTIONS_NAME[v], value: v}))"
          :change="(value) => setHasChange(() => defaultDetector = value as string)"
        />
        <SubTitleExpandable
          name="Tiny face Setting"
        >
          <SelectListItem
            name="Input Size"
            :disabled="paused || !enableFaceTrackng || (defaultDetector !== 'tiny_face')"
            :value="inputSize"
            :options="FACE_TRACKING_INPUT_SIZE_OPTIONS.map(v => ({label: '' + v, value: v}))"
            :change="(value) => setHasChange(() => inputSize = value as number)"
          />
          <CounterListItem
            name="Score threshold"
            :disabled="paused || !enableFaceTrackng || (defaultDetector !== 'tiny_face')"
            :value="scoreThreshold"
            :min="0"
            :max="1"
            :step-size=".1"
            :change="(value) => setHasChange(() => scoreThreshold = value)"
          />
        </SubTitleExpandable>
        <SubTitleExpandable
          name="SSD Mobilenet Setting"
        >
          <CounterListItem
            name="Min confidence"
            :disabled="paused || !enableFaceTrackng || (defaultDetector !== 'ssd')"
            :value="minConfidence"
            :min="0"
            :max="1"
            :step-size=".1"
            :change="(value) => setHasChange(() => minConfidence = value)"
          />
        </SubTitleExpandable>
      </SubTitleExpandable>
    </div>
    <div v-if="hasChange" class="footer">
      <div class="round-btn" @click="updateSetting">
        Update
      </div>
      <div class="round-btn cancel" @click="refresh">
        Cancel
      </div>
    </div>
  </div>
</template>

<style scoped>
  .layout {
    @apply w-full h-full flex flex-col overflow-hidden
  }

  .header {
    @apply w-full h-[50px] bg-gradient-to-r from-green-700 to-green-500 p-[12px] font-bold text-[18px] text-white
  }

  .settings {
    @apply relative w-full flex-1 flex flex-col overflow-auto
  }

  .tracking-container {
    @apply relative w-full
  }

  .tracking-status {
    @apply absolute top-1/2 right-[70px] w-[12px] h-[12px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600
  }

  .tracking-status-active {
    @apply bg-green-600
  }

  .footer {
    @apply w-full h-[50px] flex items-center border-t-[2px] border-t-emerald-600 px-[8px] font-semibold
  }

  .round-btn {
    @apply text-center w-[75px] cursor-pointer select-none text-nowrap truncate border-[2px] border-emerald-600 bg-emerald-600 hover:bg-emerald-300 hover:border-emerald-300 rounded-[8px] m-[4px] p-[6px] overflow-hidden
  }

  .cancel {
    @apply ml-[8px] border-red-600 text-red-600 hover:border-red-600 bg-white hover:bg-red-300
  }
</style>
