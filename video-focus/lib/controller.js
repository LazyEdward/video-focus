// Copyright (c) 2024 LazyEdward
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const searchVideos = () => {
	return document.getElementsByTagName('video') ?? []
}

const searchFullscreenVideos = () => {
	return document.fullscreenElement?.getElementsByTagName('video') ?? []
}

let videos = searchVideos()

const playOrResumeVideoElement = (video, focused) => {
	if(!video.getAttribute("muted"))
		video.setAttribute("muted", "false");

	if(video.ended)
		return;

	try{
		if(focused){
			if(video.paused)
				video.play()
		}
		else if(!video.paused)
			video.pause()
	}
	catch(e){
		console.log(e)
	}
}

const focusOnOffFullscreenVideo = (focused) => {
	if(!document.fullscreenElement){
		for(const video of videos)
			playOrResumeVideoElement(video, false)
		videos = [];
		return;
	}

	if(!videos || videos.length < 1)
		videos = searchFullscreenVideos();

	for(const video of videos)
		playOrResumeVideoElement(video, focused)
}

const focusOnOffVideo = (focused) => {
	let localVideos = searchVideos();

	for(const video of localVideos)
		playOrResumeVideoElement(video, focused)
}

export { focusOnOffVideo , focusOnOffFullscreenVideo, searchVideos, searchFullscreenVideos }