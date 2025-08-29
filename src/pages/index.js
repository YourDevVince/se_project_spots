import "./index.css";
import {
  enableValidation,
  settings,
  resetValidation,
  toggleButtonState,
  disableButton,
} from "../scripts/validation.js";
import Api from "../utils/Api.js";

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
  evt.preventDefault();
  setButtonLoading(
    editProfileForm.querySelector(".modal__save-btn"),
    true,
    "Save",
    "Saving..."
  );
  api
    .editUserInfo({
      name: editProfileNameInput.value,
      about: editProfileDescriptionInput.value,
    })
    .then((res) => {
      profileNameEl.textContent = res.name;
      profileDescriptionEl.textContent = res.about;
      closeModal(editProfileModal);
    })
    .catch((err) => {
      console.error(`Error: ${err}`);
    })
    .finally(() => {
      setButtonLoading(
        editProfileForm.querySelector(".modal__save-btn"),
        false,
        "Save",
        "Saving..."
      );
    });
}

editProfileForm.addEventListener("submit", handleEditProfileSubmit);

function handleAddCardSubmit(evt) {
  evt.preventDefault();
  setButtonLoading(newPostSubmitBtn, true, "Save", "Saving...");

  api
    .addNewCard({
      name: newPostNameInput.value,
      link: newPostLinkInput.value,
    })
    .then((res) => {
      const cardElement = getCardElement(res);
      cardList.prepend(cardElement);
      disableButton(newPostSubmitBtn, settings);
      newPostForm.reset();
      resetValidation(
        newPostForm,
        [newPostNameInput, newPostLinkInput],
        settings
      );
      closeModal(newPostModal);
    })
    .catch((err) => {
      console.error(`Error: ${err}`);
    })
    .finally(() => {
      setButtonLoading(newPostSubmitBtn, false, "Save", "Saving...");
    });
}

function handleEditAvatarSubmit(evt) {
  evt.preventDefault();
  setButtonLoading(editAvatarSubmitBtn, true, "Save", "Saving...");

  api
    .editUserAvatar({
      name: profileNameEl.textContent,
      avatar: editAvatarInput.value,
    })
    .then((res) => {
      profileAvatarEl.src = res.avatar;
      profileAvatarEl.alt = res.name;

      disableButton(editAvatarSubmitBtn, settings);
      editAvatarForm.reset();
      resetValidation(editAvatarForm, [editAvatarInput], settings);
      closeModal(editAvatarModal);

      disableButton(editAvatarSubmitBtn, settings);
    })
    .catch((err) => {
      console.error(`Error: ${err}`);
    })
    .finally(() => {
      setButtonLoading(editAvatarSubmitBtn, false, "Save", "Saving...");
    });
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

function handleDeleteSubmit(e) {
  e.preventDefault();
  if (!selectedCardId) return;

  setButtonLoading(deletePostDeleteBtn, true, "Delete", "Deleting...");

  api
    .deleteCard(selectedCardId)
    .then(() => {
      selectedCard?.remove();
      selectedCard = null;
      selectedCardId = null;
      closeModal(deletePostModal);
    })
    .catch((err) => console.error(`Error: ${err}`))
    .finally(() => {
      setButtonLoading(deletePostDeleteBtn, false, "Delete", "Deleting...");
    });
}

newPostForm.addEventListener("submit", handleAddCardSubmit);

enableValidation(settings);
