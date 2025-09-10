import "./index.css";
import {
  enableValidation,
  settings,
  resetValidation,
  toggleButtonState,
  disableButton,
} from "../scripts/validation.js";
import Api from "../utils/Api.js";
import { handleSubmit } from "../utils/utils.js";

let selectedCard = null;
let selectedCardId = null;

// API instance
const api = new Api({
  baseUrl: "https://around-api.en.tripleten-services.com/v1",
  headers: {
    authorization: "b3d52a96-f5c8-4919-bf09-8edcfd6eea6e",
    "Content-Type": "application/json",
  },
});
// Initialize
api
  .getAppInfo()
  .then(([cards, users]) => {
    cards.forEach((card) => {
      const cardElement = getCardElement(card);
      cardList.append(cardElement);
    });
    profileNameEl.textContent = users.name;
    profileDescriptionEl.textContent = users.about;
    profileAvatarEl.src = users.avatar;
    profileAvatarEl.alt = users.name;
    editProfileNameInput.value = users.name;
    editProfileDescriptionInput.value = users.about;
  })
  .catch((err) => {
    console.error(`Error: ${err}`);
  });

// Edit avatar modal elements
const editAvatarBtn = document.querySelector(".profile__avatar-edit-btn");
const editAvatarModal = document.querySelector("#edit-avatar-modal");
const editAvatarCloseBtn = editAvatarModal.querySelector(".modal__close-btn");
const editAvatarForm = editAvatarModal.querySelector(".modal__form");
const editAvatarInput = editAvatarModal.querySelector("#avatar-link-input");
const editAvatarSubmitBtn = editAvatarModal.querySelector(".modal__save-btn");

// Edit profile modal elements
const editProfileBtn = document.querySelector(".profile__edit-btn");
const editProfileModal = document.querySelector("#edit-profile-modal");
const editProfileCloseBtn = editProfileModal.querySelector(".modal__close-btn");
const editProfileForm = editProfileModal.querySelector(".modal__form");
const editProfileNameInput = editProfileModal.querySelector(
  "#profile-name-input"
);
const editProfileDescriptionInput = editProfileModal.querySelector(
  "#profile-description-input"
);
// New post modal elements
const newPostModalBtn = document.querySelector(".profile__add-btn");
const newPostModal = document.querySelector("#new-post-modal");
const newPostCloseBtn = newPostModal.querySelector(".modal__close-btn");
const newPostForm = newPostModal.querySelector(".modal__form");
const newPostSubmitBtn = newPostModal.querySelector(".modal__save-btn");
const newPostNameInput = newPostModal.querySelector("#card-caption-input");
const newPostLinkInput = newPostModal.querySelector("#card-image-input");
// Preview modal elements
const previewModal = document.querySelector("#preview-modal");
const previewModalCloseBtn = previewModal.querySelector(".modal__close-btn");
const previewImage = previewModal.querySelector(".modal__image");
const previewCaption = previewModal.querySelector(".modal__caption");

// Template and card list
const cardTemplate = document
  .querySelector("#card-template")
  .content.querySelector(".card");
const cardList = document.querySelector(".cards__list");

// Open and close modal functions

const openModal = (modal) => {
  modal.classList.add("modal_is-opened");

  const handleEscClose = (evt) => {
    if (evt.key === "Escape") {
      closeModal(modal);
      document.removeEventListener("keydown", handleEscClose);
    }
  };
  const handleOverlayClose = (evt) => {
    if (evt.target === modal) {
      closeModal(modal);
      modal.removeEventListener("click", handleOverlayClose);
    }
  };

  document.addEventListener("keydown", handleEscClose);
  modal.addEventListener("click", handleOverlayClose);
};

const closeModal = (modal) => {
  modal.classList.remove("modal_is-opened");
};

function setButtonLoading(btn, isLoading, idleText, loadingText) {
  if (!btn) return;
  btn.textContent = isLoading ? loadingText : idleText;
  btn.disabled = isLoading;
}

// Delete card modal elements and handlers
function handleDeleteCard(cardElement, data) {
  selectedCard = cardElement;
  selectedCardId = data._id;
  openModal(deletePostModal);
}

const getCardElement = (data) => {
  const cardElement = cardTemplate.cloneNode(true);
  const cardImage = cardElement.querySelector(".card__image");
  const cardTitle = cardElement.querySelector(".card__title");
  const cardLikeBtn = cardElement.querySelector(".card__like-btn");
  const cardDeleteBtn = cardElement.querySelector(".card__delete-btn");

  cardImage.src = data.link;
  cardImage.alt = data.name;
  cardTitle.textContent = data.name;

  if (data.isLiked) {
    cardLikeBtn.classList.add("card__like-btn_active");
  } else {
    cardLikeBtn.classList.remove("card__like-btn_active");
  }

  cardLikeBtn.addEventListener("click", () => {
    const isActive = cardLikeBtn.classList.contains("card__like-btn_active");

    cardLikeBtn.disabled = true;

    const req = isActive ? api.dislikeCard(data._id) : api.likeCard(data._id);

    req
      .then((updatedCard) => {
        if (updatedCard.isLiked) {
          cardLikeBtn.classList.add("card__like-btn_active");
        } else {
          cardLikeBtn.classList.remove("card__like-btn_active");
        }
      })
      .catch((err) => {
        console.error(`Error: ${err}`);
      })
      .finally(() => {
        cardLikeBtn.disabled = false;
      });
  });

  cardImage.addEventListener("click", () => {
    previewCaption.textContent = data.name;
    previewImage.src = data.link;
    previewImage.alt = data.name;
    openModal(previewModal);
  });

  cardDeleteBtn.addEventListener("click", () => {
    handleDeleteCard(cardElement, data);
  });

  return cardElement;
};

// Preview modal close handler
function handlePreviewModalClose() {
  closeModal(previewModal);
}
previewModalCloseBtn.addEventListener("click", handlePreviewModalClose);

// Profile elements
const profileNameEl = document.querySelector(".profile__name");
const profileDescriptionEl = document.querySelector(".profile__description");
const profileAvatarEl = document.querySelector(".profile__avatar");

// Event listeners for opening and closing modals

editAvatarBtn.addEventListener("click", function () {
  openModal(editAvatarModal);
});

editAvatarCloseBtn.addEventListener("click", function () {
  closeModal(editAvatarModal);
});

editProfileBtn.addEventListener("click", function () {
  editProfileNameInput.value = profileNameEl.textContent;
  editProfileDescriptionInput.value = profileDescriptionEl.textContent;

  resetValidation(
    editProfileForm,
    [editProfileNameInput, editProfileDescriptionInput],
    settings
  );

  toggleButtonState(
    [editProfileNameInput, editProfileDescriptionInput],
    editProfileForm.querySelector(settings.submitButtonSelector),
    settings
  );

  openModal(editProfileModal);
});

editProfileCloseBtn.addEventListener("click", function () {
  closeModal(editProfileModal);
});

newPostModalBtn.addEventListener("click", function () {
  openModal(newPostModal);
});
newPostCloseBtn.addEventListener("click", function () {
  closeModal(newPostModal);
});

// Form submit handlers

function handleEditProfileSubmit(evt) {
  function makeRequest() {
    return api
      .editUserInfo({
        name: editProfileNameInput.value,
        about: editProfileDescriptionInput.value,
      })
      .then((user) => {
        profileNameEl.textContent = user.name;
        profileDescriptionEl.textContent = user.about;
        closeModal(editProfileModal);
      });
  }
  handleSubmit(makeRequest, evt, "Saving...");
}
editProfileForm.addEventListener("submit", handleEditProfileSubmit);

function handleAddCardSubmit(evt) {
  function makeRequest() {
    return api
      .addNewCard({
        name: newPostNameInput.value,
        link: newPostLinkInput.value,
      })
      .then((card) => {
        cardList.prepend(getCardElement(card));
        closeModal(newPostModal);
        // handleSubmit will reset the form; do your extras:
        disableButton(newPostSubmitBtn, settings);
        resetValidation(
          newPostForm,
          [newPostNameInput, newPostLinkInput],
          settings
        );
      });
  }
  handleSubmit(makeRequest, evt, "Saving...");
}
newPostForm.addEventListener("submit", handleAddCardSubmit);

function handleEditAvatarSubmit(evt) {
  function makeRequest() {
    return api
      .editUserAvatar({ avatar: editAvatarInput.value })
      .then((user) => {
        profileAvatarEl.src = user.avatar;
        profileAvatarEl.alt = user.name;
        closeModal(editAvatarModal);
        disableButton(editAvatarSubmitBtn, settings);
        resetValidation(editAvatarForm, [editAvatarInput], settings);
      });
  }
  handleSubmit(makeRequest, evt, "Saving...");
}
editAvatarForm.addEventListener("submit", handleEditAvatarSubmit);

const deletePostModal = document.querySelector("#delete-post-modal");
const deletePostForm = document.querySelector("#delete-post-form");
const deletePostDeleteBtn = deletePostForm.querySelector(".modal__delete-btn");
deletePostForm.addEventListener("submit", handleDeleteSubmit);

const deletePostCloseBtn = deletePostModal.querySelector(".modal__close-btn");
const deletePostCancelBtn = deletePostModal.querySelector(
  ".modal__delete-btn_cancelled"
);

deletePostCloseBtn?.addEventListener("click", () =>
  closeModal(deletePostModal)
);
deletePostCancelBtn?.addEventListener("click", () =>
  closeModal(deletePostModal)
);

function handleDeleteSubmit(evt) {
  if (!selectedCardId) return;

  function makeRequest() {
    return api.deleteCard(selectedCardId).then(() => {
      selectedCard?.remove();
      selectedCard = null;
      selectedCardId = null;
      closeModal(deletePostModal);
    });
  }

  // Shows "Deleting..." on the clicked button, then restores original text
  handleSubmit(makeRequest, evt, "Deleting...");
}
deletePostForm.addEventListener("submit", handleDeleteSubmit);

enableValidation(settings);
