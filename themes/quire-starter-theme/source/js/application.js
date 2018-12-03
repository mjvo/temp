/**
 * @fileOverview
 * @name application.js
 * @description This file serves as the entry point for Webpack, the JS library
 * responsible for building all CSS and JS assets for the theme.
 */
// Stylesheets
import 'leaflet-fullscreen/dist/leaflet.fullscreen.css'
import '../css/application.scss'
import 'leaflet/dist/leaflet.css'


// JS Libraries (add them to package.json with `npm install [library]`)
import $ from 'jquery'
import 'velocity-animate'
import './soundcloud-api'

// Modules (feel free to define your own and import here)
import Search from './search'
import Navigation from './navigation'
import Popup from './popup'
import DeepZoom from './deepzoom'
import Map from './map'

/**
 * toggleMenu
 * @description Show/hide the menu UI by changing CSS classes and Aria status.
 * This function is bound to the global window object so it can be called from
 * templates without additinoal binding.
 */

window.toggleMenu = () => {
  let menu = document.getElementById('site-menu')
  let menuAriaStatus = menu.getAttribute('aria-expanded')
  menu.classList.toggle('is-expanded')

  if (menuAriaStatus === 'true') {
    menu.setAttribute('aria-expanded', 'false')
  } else {
    menu.setAttribute('aria-expanded', 'true')
  }
}

/**
 * activeMenuPage
 * @description This function is called on pageSetup to go through the navigation 
 * (#nav in partials/menu.html) and find all the anchor tags.  Then find the user's 
 * current URL directory. Then it goes through the array of anchor tags and if the 
 * current URL directory matches the nav anchor, it's the active link.
 */
function activeMenuPage() {
  let nav = document.getElementById('nav'),
      anchor = nav.getElementsByTagName('a'),
      current = window.location.protocol + '//' + window.location.host + window.location.pathname;
  for (var i = 0; i < anchor.length; i++) {
    if(anchor[i].href == current) {
        anchor[i].className = "active";
    }
  }
}

/**
 * toggleSearch
 * @description Show/hide the search UI by changing CSS classes and Aria status.
 * This function is bound to the global window object so it can be called from
 * templates without additinoal binding.
 */
window.toggleSearch = () => {
  let searchControls = document.getElementById('js-search')
  let searchInput = document.getElementById('js-search-input')
  let searchAriaStatus = searchControls.getAttribute('aria-expanded')
  searchControls.classList.toggle('is-active')

  if (searchAriaStatus === 'true') {
    searchControls.setAttribute('aria-expanded', 'false')
  } else {
    searchInput.focus()
    searchControls.setAttribute('aria-expanded', 'true')
  }
}

/**
 * sliderSetup
 * @description Set up the simple image slider used on catalogue entry pages for
 * objects with multiple figure images. See also slideImage function below.
 */
function sliderSetup() {
  let slider = $('.quire-entry__image__group-container')
  slider.each(function () {
    let sliderImages = $(this).find('figure')
    let firstImage = $(sliderImages.first())
    let lastImage = $(sliderImages.last())
    sliderImages.hide()
    firstImage.addClass('current-image first-image')
    firstImage.css('display', 'flex')
    lastImage.addClass('last-image')
  });
}

/**
 * slideImage
 * @description Slide to previous or next catalogue object image in a loop.
 * Supports any number of figures per object, and any number of obejects
 * per page.
 */
window.slideImage = (direction) => {
  let slider = $(event.target).closest('.quire-entry__image__group-container')
  let firstImage = slider.children('.first-image')
  let lastImage = slider.children('.last-image')
  let currentImage = slider.children('.current-image')
  let nextImage = currentImage.next('figure')
  let prevImage = currentImage.prev('figure')
  currentImage.hide()
  currentImage.removeClass('current-image')
  if (direction == "next") {
    if (currentImage.hasClass('last-image')) {
      firstImage.addClass('current-image')
      firstImage.css('display', 'flex')
    } else {
      nextImage.addClass('current-image')
      nextImage.css('display', 'flex')
    }
  } else if (direction == "prev") {
    if (currentImage.hasClass('first-image')) {
      lastImage.addClass('current-image')
      lastImage.css('display', 'flex')
    } else {
      prevImage.addClass('current-image')
      prevImage.css('display', 'flex')
    }
  }
}

/**
 * search
 * @description makes a search query using Lunr
 */
window.search = () => {
  let searchInput = document.getElementById('js-search-input')
  let searchQuery = searchInput.value
  let searchInstance = window.QUIRE_SEARCH
  let resultsContainer = document.getElementById('js-search-results-list')
  let resultsTemplate = document.getElementById('js-search-results-template')

  if (searchQuery.length >= 3) {
    let searchResults = searchInstance.search(searchQuery)
    displayResults(searchResults)
  }

  function clearResults() {
    resultsContainer.innerbody = ''
  }

  function displayResults(results) {
    clearResults()
    results.forEach(result => {
      let clone = document.importNode(resultsTemplate.content, true)
      let item = clone.querySelector('.js-search-results-item')
      let title = clone.querySelector('.js-search-results-item-title')
      let type = clone.querySelector('.js-search-results-item-type')
      let length = clone.querySelector('.js-search-results-item-length')
      item.href = result.url
      title.textContent = result.title
      type.textContent = result.type
      length.textContent = result.length
      resultsContainer.appendChild(clone)
    })
  }
}

/**
 * globalSetup
 * @description Initial setup on first page load.
 */
function globalSetup() {
  let container = document.getElementById('container')
  container.classList.remove('no-js')
  var classNames = [];
  if (navigator.userAgent.match(/(iPad|iPhone|iPod)/i)) classNames.push('device-ios');
  if (navigator.userAgent.match(/android/i)) classNames.push('device-android');

  var body = document.getElementsByTagName('body')[0];

  if (classNames.length) classNames.push('on-device');
  if (body.classList) body.classList.add.apply(body.classList, classNames);
  loadSearchData()
  scrollToHash()
}

/**
 * loadSearchData
 * @description Load full-text index data from the specified URL
 * and pass it to the search module.
 */
function loadSearchData() {
  // Grab search data
  let dataURL = $('#js-search').data('search-index')
  $.get(dataURL, { cache: true }).done(data => {
    window.QUIRE_SEARCH = new Search(data)
  })
}

let navigation
function navigationSetup() {
  if (!navigation) {
    navigation = new Navigation()
  }
}

function navigationTeardown() {
  if (navigation) {
    navigation.teardown()
  }
  navigation = undefined
}

/**
 * scrollToHash
 * @description Scroll the #main area after each smoothState reload.
 * If a hash id is present, scroll to the location of that element,
 * taking into account the height of the navbar.
 */
function scrollToHash() {
  let $scroller = $("#main")
  let $navbar = $(".quire-navbar")
  let targetHash = window.location.hash;

  if (targetHash) {
    let targetHashEl = document.getElementById(targetHash.slice(1))
    let $targetHashEl = $(targetHashEl)

    if ($targetHashEl.length) {
      let newPosition = $targetHashEl.offset().top
      if ($navbar.length) {
        newPosition -= $navbar.height()
      }
      $scroller.scrollTop(newPosition)
    }
  } else {
    $scroller.scrollTop(0)
  }
}

/**
 * @description
 * Set up modal for media
 */
function popupSetup() {
  if (isPopup) {
    Popup('.q-figure__wrapper')
  }
}

/**
 * @description 
 * Render Map if Popup @false
 */
function mapSetup() {
  [...document.querySelectorAll('.quire-map')].forEach(v => {
    let id = v.getAttribute('id')
    new Map(id)
  })
}

/**
 * @description 
 * Render deepzoom or iiif if Popup @false
 */
function deepZoomSetup() {
  [...document.querySelectorAll('.quire-deepzoom')].forEach(v => {
    let id = v.getAttribute('id')
    new DeepZoom(id)
  })
}

/**
 * pageSetup
 * @description This function is called after each smoothState reload.
 * Initialize any jquery plugins or set up page UI elements here.
 */
function pageSetup() {
  activeMenuPage()
  sliderSetup()
  // navigationSetup()
  popupSetup()
  if (!isPopup) {
    mapSetup()
    deepZoomSetup()
  }
}

/**
 * pageTeardown
 * @description This function is called before each smoothState reload.
 * Remove any event listeners here.
 */
function pageTeardown() {
  navigationTeardown()
}

// Start
// -----------------------------------------------------------------------------
//
// Run immediately
globalSetup()

// Run when document is ready
$(document).ready(() => {
  pageSetup()
})