<!--
 Copyright (c) 2024 LazyEdward
 
 This software is released under the MIT License.
 https://opensource.org/licenses/MIT
-->

<script setup lang="ts">
	type TSwitchListItem = {
		disabled?: boolean,
		name: string,
		value: boolean,
		change: (value: boolean) => void
	}

	const props = withDefaults(defineProps<TSwitchListItem>(), {
		disabled: false
	});

	const onswitch = () => {
		if(props.disabled)
			return

		props.change(!props.value)
	}
</script>

<template>
	<div class="switch-item">
		<span :title="props.name" class="switch-name">
			{{ props.name }}
		</span>
		<span class="switch-button" :class="{'switch-active' : props.value, 'switch-disabled' : props.disabled }" @click="onswitch">
			<span class="switch-slider" :class="{'switch-slider-active' : props.value, 'switch-slider-inactive' : !props.value }"/>
		</span>
	</div>
</template>

<style scoped>
	.switch-item {
		@apply w-full flex justify-between items-center px-[12px] py-[8px] border-b-[2px] border-b-emerald-300
	}

	.switch-name {
		width: calc(100% - 50px);
		@apply text-[16px] truncate overflow-hidden text-nowrap
	}

	.switch-button {
		@apply cursor-pointer select-none w-[50px] h-[30px] relative bg-gray-600 rounded-[16px]
	}

	.switch-active {
		@apply bg-emerald-600
	}

	.switch-disabled {
		@apply cursor-not-allowed opacity-50
	}

	.switch-slider {
		transition: all .2s ease-out;
		@apply absolute rounded-full shadow-md bg-white w-[25px] h-[25px] -translate-x-1/2 -translate-y-1/2 top-[15px]
	}

	.switch-slider-active {
		@apply left-[35px]
	}

	.switch-slider-inactive {
		@apply left-[15px]
	}
</style>