<!--
 Copyright (c) 2024 LazyEdward
 
 This software is released under the MIT License.
 https://opensource.org/licenses/MIT
-->

<script setup lang="ts">
import ArrowRight from './icons/ArrowRight.vue';

	type TLinkItem = {
		disabled: boolean,
		name: string,
		open: () => void
	}

	const props = withDefaults(defineProps<TLinkItem>(), {
		disabled: false
	});

	const onopen = () => {
		if(props.disabled)
			return

		props.open()
	}
</script>

<template>
	<div class="link-item" :class="{'link-disabled' : props.disabled }" @click="onopen">
		<span :title="props.name" class="link-name" >
			{{ props.name }}
		</span>
		<ArrowRight class="link-button"/>
	</div>
</template>

<style scoped>
	.link-item {
		@apply cursor-pointer w-full flex justify-between items-center px-[12px] py-[8px] border-b-[2px] border-b-emerald-300
	}

	.link-name {
		width: calc(100% - 30px);
		@apply text-[16px] truncate overflow-hidden text-nowrap
	}

	.link-button {
		@apply w-[30px] h-[30px] text-white select-none
	}

	.link-disabled {
		@apply cursor-not-allowed opacity-50
	}

</style>