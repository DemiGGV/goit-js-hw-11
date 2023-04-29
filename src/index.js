import { Notify } from 'notiflix/build/notiflix-notify-aio';
import '../node_modules/simplelightbox/dist/simple-lightbox.min.css';
import SimpleLightbox from 'simplelightbox';
import { fetchGetImg } from './js/fetchGetImg';

const refs = {
  searchForm: document.querySelector('.search-form'),
  gallery: document.querySelector('.gallery'),
  jsGuard: document.querySelector('.js-guard'),
};
let imgGallery;
let currentPage = 1;
let querry;
let order;
let totalHits = 0;
let options = {
  root: null,
  rootMargin: '500px',
  threshold: 1.0,
};
const PER_PAGE = 40;

refs.searchForm.addEventListener('submit', onSubmitQuerry);
refs.gallery.addEventListener('click', onClickGalleryItem);

function onSubmitQuerry(event) {
  event.preventDefault();
  const {
    elements: { querry: q, order: o },
  } = event.currentTarget;
  querry = q.value;
  order = o.value;
  clearField();
  getData(currentPage);
  console.log('get1');
}

let observer = new IntersectionObserver(onLoad, options);
function onLoad(entries) {
  console.log(entries);
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      currentPage++;
      getData(currentPage);
      console.log('get2');
    }
  });
}

function getData(currentPage) {
  fetchGetImg(querry, order, currentPage, PER_PAGE)
    .then(data => {
      if (data.hits.length === 0) {
        Notify.failure(
          'Sorry, there are no images matching your search query. Please try again.'
        );
        return;
      }
      totalHits = data.totalHits;
      renderGallery(data.hits);
      if (currentPage > 1) {
        imgGallery.destroy();
      }
      imgGallery = new SimpleLightbox('.gallery a', {
        captionsData: 'alt',
        captionDelay: 250,
      });
      if (currentPage === 1) {
        Notify.success(`Hooray! We found ${data.totalHits} images.`);
      }
      if (currentPage === Math.ceil(totalHits / PER_PAGE)) {
        observer.unobserve(refs.jsGuard);
      } else {
        observer.observe(refs.jsGuard);
      }
    })
    .catch(error => console.error(error));
}

function onClickGalleryItem(e) {
  e.preventDefault();
  imgGallery.on('show.simplelightbox');
  imgGallery.on('error.simplelightbox', e =>
    console.log('error in SimpleGallery:', e)
  );
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

function clearField() {
  refs.gallery.innerHTML = '';
  refs.searchForm.reset();
  currentPage = 1;
}
