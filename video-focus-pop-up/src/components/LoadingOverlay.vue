<!--
 Copyright (c) 2024 LazyEdward
 
 This software is released under the MIT License.
 https://opensource.org/licenses/MIT
-->

<script setup lang="ts">
	type TLoadingOverlay = {
		show: boolean
	}

	const props = defineProps<TLoadingOverlay>();

</script>

<template>
	<div class="loading-container" :class="{ 'loading-container-show' : props.show }">
		<div class="loading-spiner"/>
	</div>
</template>

<style scoped>
	.loading-container {
		@apply z-[2] absolute w-full h-full hidden justify-center items-center bg-slate-600 bg-opacity-50
	}

	.loading-container-show {
		@apply flex
	}

	.loading-spiner {
		@apply border-gray-300 h-[75px] w-[75px] animate-spin rounded-full border-8 border-t-gray-700
	}

</style>