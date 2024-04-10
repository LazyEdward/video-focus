<!--
 Copyright (c) 2024 LazyEdward
 
 This software is released under the MIT License.
 https://opensource.org/licenses/MIT
-->

<script setup lang="ts">
	import ArrowDown from './icons/ArrowDown.vue'
	import { ref } from 'vue'

	export type TSelectOption = {
		label: string,
		value: string | number
	}

	export type TSelectItem = {
		disabled: boolean,
		value: string | number,
		options: TSelectOption[],
		change: (value: string | number) => void
	}

	const props = withDefaults(defineProps<TSelectItem>(), {
		disabled: false
	});

	const showOptions = ref(false);

	const getLabelByValue = (value: string | number) : string => {
		let index = props.options.findIndex(v => v.value === value);

		return index === -1 ? "" : props.options[index].label;
	}

	const selectOption = (value: string | number) => {
		props.change(value)
		showOptions.value = false;
	}

</script>

<template>
	<div class="round-select" :class="{'round-select-disabled': props.disabled}" @click="showOptions = !props.disabled">
		<span :title="getLabelByValue(value)" class="round-name">
			{{ getLabelByValue(value) }}
		</span>
		<ArrowDown class="icon"/>
	</div>
	<div v-if="showOptions" class="round-popup" @click.prevent="showOptions = false">
		<div class="popup-container">
			<div title=" -- Select an option -- " class="popup-item"> -- Select an option -- </div>
			<div
				v-for="option in options"
				:key="option.label"
				:title="option.label"
				class="popup-item popup-item-selectable"
				:class="{'popup-item-selected': option.value === props.value}"
				@click="() => selectOption(option.value)"
			>
				{{ option.label }}
			</div>
		</div>
	</div>
</template>

<style scoped>
	.round-select {
		@apply cursor-pointer select-none w-[100px] p-[4px] m-[2px] flex justify-center items-center truncate overflow-hidden text-nowrap rounded-[8px] border-[2px] hover:border-emerald-300 hover:text-emerald-300
	}

	.round-select-disabled {
		@apply cursor-not-allowed opacity-50 border-gray-300 text-gray-300 hover:border-gray-300 hover:text-gray-300
	}

	.round-name {
		width: calc(100% - 8px);
		@apply px-[4px] text-[16px] truncate overflow-hidden text-nowrap
	}

	.icon {
		@apply px-[2px] w-[15px] h-[15px]
	}

	.round-popup {
		@apply fixed left-0 top-0 flex justify-center items-center w-screen h-screen bg-opacity-50 bg-gray-200
	}

	.popup-container {
		@apply flex flex-col w-[85vw] h-auto max-h-[85vh] rounded-[8px] overflow-auto bg-gray-900
	}

	.popup-item {
		@apply w-full truncate overflow-hidden px-[12px] py-[8px] border-b-[2px] border-b-emerald-300
	}

	.popup-item-selectable {
		@apply cursor-pointer select-none
	}

	.popup-item-selected {
		@apply font-semibold text-gray-900 bg-emerald-200
	}

</style>