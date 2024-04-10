<!--
 Copyright (c) 2024 LazyEdward
 
 This software is released under the MIT License.
 https://opensource.org/licenses/MIT
-->

<script setup lang="ts">
	import SelectItem, { type TSelectItem } from './SelectItem.vue'

	type TSelectListItem = {
		name: string,
	} & TSelectItem

	const props = defineProps<TSelectListItem>();
</script>

<template>
	<div class="select-list-item">
		<span :title="props.name" class="select-name">
			{{ props.name }}
		</span>
		<SelectItem :disabled="props.disabled" :value="props.value" :options="props.options" :change="props.change"/>
	</div>
</template>

<style scoped>
	.select-list-item {
		@apply w-full flex justify-between items-center px-[12px] py-[8px] border-b-[2px] border-b-emerald-300
	}

	.select-name {
		width: calc(100% - 120px);
		@apply text-[16px] truncate overflow-hidden text-nowrap
	}
</style>