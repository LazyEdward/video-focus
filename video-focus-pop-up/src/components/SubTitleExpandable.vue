<!--
 Copyright (c) 2024 LazyEdward
 
 This software is released under the MIT License.
 https://opensource.org/licenses/MIT
-->

<script setup lang="ts">
	import ArrowUp from './icons/ArrowUp.vue'
	import ArrowDown from './icons/ArrowDown.vue'
	import { ref } from 'vue'

	type TSubTitleExpandable = {
		name: string
	}

	const props = defineProps<TSubTitleExpandable>();

	const show = ref(true);
</script>

<template>
	<div class="sub-container">
		<div :title="props.name" class="title-container" @click="show = !show">
			<span class="title">
				{{ props.name }}
			</span>
			<ArrowUp v-if="show" class="icon"/>
			<ArrowDown v-if="!show" class="icon"/>
		</div>
		<div class="sub-settings" :class="{ 'sub-settings-show' : show, 'sub-settings-hidden' : !show}">
			<div class="sub-settings-container">
				<slot/>
			</div>
		</div>
	</div>
</template>

<style scoped>
	.sub-container {
		@apply w-full flex flex-col
	}

	.title-container {
		@apply cursor-pointer select-none w-full flex justify-between items-center px-[8px] py-[10px] border-b-[2px] border-b-emerald-300 bg-gradient-to-r from-gray-700 to-gray-500
	}

	.title {
		width: calc(100% - 30px);
		@apply text-[16px] font-semibold text-white truncate text-nowrap overflow-hidden
	}

	.icon {
		@apply w-[30px] h-[30px] text-white
	}

	.sub-settings {
		/* https://keithjgrant.com/posts/2023/04/transitioning-to-height-auto/ */
		transition: grid-template-rows 0.2s ease-out;
		@apply w-full grid
	}

	.sub-settings-container {
		@apply overflow-hidden
	}

	.sub-settings-show {
		@apply grid-rows-[1fr]
	}

	.sub-settings-hidden {
		@apply grid-rows-[0fr]
	}
</style>