import { Notify } from 'notiflix/build/notiflix-notify-aio';
import '../node_modules/simplelightbox/dist/simple-lightbox.min.css';
import SimpleLightbox from 'simplelightbox';
import { fetchGetImg } from './js/fetchGetImg';

const refs = {
  searchForm: document.querySelector('.search-form'),
  gallery: document.querySelector('.gallery'),
  jsGuard: document.querySelector('.js-guard'),
  jsLoader: document.querySelector('.js-loader'),
};
let imgGallery;
let currentPage = 1;
let querry;
let order;
let totalHits = 0;
let optionsObserver = {
  root: null,
  rootMargin: '600px',
  threshold: 1.0,
};
const PER_PAGE = 40;
//--- Scroll Up Button Object
const btnUp = {
  element: document.querySelector('.btn-up'),
  show() {
    this.element.hidden = false;
  },
  hide() {
    this.element.hidden = true;
  },
  addEventListener() {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      scrollY > 500 ? this.show() : this.hide();
    });
    document.querySelector('.btn-up').onclick = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });
    };
  },
};

btnUp.addEventListener();
refs.searchForm.addEventListener('submit', onSubmitQuerry);
let observer = new IntersectionObserver(onLoad, optionsObserver);

function onSubmitQuerry(event) {
  event.preventDefault();
  refs.jsLoader.classList.toggle('loader');
  const {
    elements: { querry: q, order: o },
  } = event.currentTarget;
  querry = q.value;
  order = o.value;
  if (!querry) {
    Notify.failure('Input search query!');
    return;
  }
  resetSearch();
  observer.unobserve(refs.jsGuard);
  getData(currentPage);
}

function onLoad(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      currentPage++;
      getData(currentPage);
    }
  });
}

function getData(currentPage) {
  fetchGetImg(querry, order, currentPage, PER_PAGE)
    .then(data => {
      if (!data.hits.length && !data.totalHits) {
        Notify.failure(
          'Sorry, there are no images matching your search query. Please try again.'
        );
        return;
      }
      totalHits = data.totalHits;
      if (currentPage === 1) {
        refs.jsLoader.classList.toggle('loader');
        Notify.success(`Hooray! We found ${data.totalHits} images.`);
      }
      renderGallery(data.hits);
      if (currentPage > 1) {
        imgGallery.refresh();
      } else {
        imgGallery = new SimpleLightbox('.gallery a', {
          captionsData: 'alt',
          captionDelay: 250,
        });
      }
      observer.observe(refs.jsGuard);
      if (currentPage === Math.ceil(totalHits / PER_PAGE)) {
        observer.unobserve(refs.jsGuard);
      }
    })
    .catch(error => console.error(error));
}

function renderGallery(dataArr) {
  refs.gallery.insertAdjacentHTML('beforeend', galleryMarkup(dataArr));
}

function galleryMarkup(dataArr) {
  return dataArr
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => `
        <div class="photo-card">
        <a href="${largeImageURL}">
        <img src="${webformatURL}" alt="${tags}" loading="lazy" width='200' height='120' />
        <div class="info">
        <p class="info-item">
        <b>Likes</b>
        <span>${likes}</span>
        </p>
        <p class="info-item">
        <b>Views</b>
        <span>${views}</span>
        </p>
        <p class="info-item">
        <b>Comments</b>
        <span>${comments}</span>
        </p>
        <p class="info-item">
        <b>Downloads</b>
        <span>${downloads}</span>
        </p>
        </div>
        </a>
        </div>`
    )
    .join('');
}

function resetSearch() {
  refs.gallery.innerHTML = '';
  currentPage = 1;
}
