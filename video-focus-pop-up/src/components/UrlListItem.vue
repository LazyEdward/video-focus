<!--
 Copyright (c) 2024 LazyEdward
 
 This software is released under the MIT License.
 https://opensource.org/licenses/MIT
-->

<script setup lang="ts">
	import SelectItem, { type TSelectOption } from './SelectItem.vue'

	type TUrlListItem = {
		disabled: boolean,
		name: string,
		value: string,
		options: TSelectOption[],
		change: (value: string) => void
	}

	const props = withDefaults(defineProps<TUrlListItem>(), {
		disabled: false
	});

	const getUrlPrefix = () : string => {
		return props.value.startsWith('http://') ? 'http://' : 'https://'
	}

	const getUrlSuffix = () : string => {
		return props.value.replace(getUrlPrefix(), "");
	}

	const onchange = (value: string) => {
		if(props.disabled)
			return

		props.change(getUrlPrefix() + value)
	}

	const onEnter = (ele: HTMLInputElement) => {
		if(props.disabled)
			return

		props.change(getUrlPrefix() + getUrlSuffix())
		ele.blur()
	}

</script>

<template>
	<div class="url-list-header">
		<span :title="props.name" class="url-name">
			{{ props.name }}
		</span>
		<div class="url-list-item">
			<div class="url-select-item">
				<SelectItem :disabled="props.disabled" :value="getUrlPrefix()" :options="props.options" :change="(value) => props.change(value + getUrlSuffix())"/>
			</div>
			<div class="url-input-item">
				<input :disabled="props.disabled" type="text" :value="getUrlSuffix()" @keypress.enter="(e) => onEnter((e.target as HTMLInputElement))" @change="(e) => onchange((e.target as HTMLInputElement).value)">
			</div>
		</div>
	</div>
</template>

<style scoped>
	.url-list-header {
		@apply w-full flex flex-col px-[12px] py-[8px] border-b-[2px] border-b-emerald-300
	}

	.url-name {
		@apply w-full text-[16px] truncate overflow-hidden text-nowrap
	}

	.url-list-item {
		@apply mb-[2px] w-full flex justify-between items-center
	}

	.url-select-item {
		@apply min-w-[85px] flex items-center shrink-0
	}

	.url-input-item {
		@apply pointer-events-none w-full flex items-center flex-1 truncate text-nowrap text-sm mx-[4px] border-b-[2px] border-b-white hover:border-b-emerald-300
	}

	.url-input-item-disabled {
		@apply opacity-50 border-b-gray-300 hover:border-b-gray-300
	}

	.url-input-item > input {
		@apply h-[30px] bg-transparent flex-1 pointer-events-auto mx-[4px] focus-visible:outline-none hover:bg-white hover:text-gray-900 focus:bg-white focus:text-gray-900
	}
</style>