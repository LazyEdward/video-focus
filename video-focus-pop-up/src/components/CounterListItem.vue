<!--
 Copyright (c) 2024 LazyEdward
 
 This software is released under the MIT License.
 https://opensource.org/licenses/MIT
-->

<script setup lang="ts">
	import MinusIcon from './icons/MinusIcon.vue'
	import PlusIcon from './icons/PlusIcon.vue'

	type TCounterListItem = {
		disabled: boolean,
		name: string,
		value: number,
		min: number,
		max: number,
		stepSize: number,
		change: (value: number) => void
	}

	const props = withDefaults(defineProps<TCounterListItem>(), {
		disabled: false
	});

	const canSubtract = () => (props.value * 10 - props.stepSize * 10) / 10 >= props.min
	const canAdd = () => (props.value * 10 + props.stepSize * 10) / 10 <= props.max
	
	const subtract = () => {
		if(!props.disabled && canSubtract())
			props.change((props.value * 10 - props.stepSize * 10) / 10)
	}
	
	const add = () => {
		if(!props.disabled &&canAdd())
			props.change((props.value * 10 + props.stepSize * 10) / 10)
	}
</script>

<template>
	<div class="counter-list-item">
		<span :title="props.name" class="counter-name">
			{{ props.name }}
		</span>
		<div class="counter-item">
			<MinusIcon class="counter-button counter-subtract" :class="{'counter-disabled': props.disabled || !canSubtract()}" @click="subtract"/>
			<div class="counter-value">{{ props.value }}</div>
			<PlusIcon class="counter-button counter-add" :class="{'counter-disabled': props.disabled || !canAdd()}" @click="add"/>
		</div>
	</div>
</template>

<style scoped>
	.counter-list-item {
		@apply w-full flex justify-between items-center px-[12px] py-[8px] border-b-[2px] border-b-emerald-300
	}

	.counter-item {
		@apply flex justify-end items-center
	}

	.counter-name {
		width: calc(100% - 120px);
		@apply text-[16px] truncate overflow-hidden text-nowrap
	}

	.counter-button {
		@apply cursor-pointer select-none w-[30px] h-[30px] rounded-[16px]
	}

	.counter-add {
		@apply text-red-600 hover:text-red-300
	}

	.counter-subtract {
		@apply text-emerald-600 hover:text-emerald-300
	}

	.counter-disabled {
		@apply cursor-not-allowed text-gray-300 hover:text-gray-300
	}

	.counter-value {
		@apply w-[50px] p-[4px] text-center text-[14px]
	}

</style>