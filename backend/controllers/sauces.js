const Sauce = require("../models/sauce");
const fs = require("fs");

// Récupération de toutes les sauces
exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({ error: error }))
};


//récupération d'une sauce que l'utilisateur sélectionne
exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => res.status(200).json(sauce))
    .catch(error => res.status(404).json({ error: error }))
};


// création d'une sauce
exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  const sauce = new Sauce({
    ...sauceObject,
    likes: 0,
    dislikes: 0,
    usersDisliked: [],
    usersLiked: [],
    imageUrl: `${req.protocol}://${req.get("host")}/images/${ req.file.filename }`,
  });
  sauce.save()
    .then(() => res.status(201).json({ message: "Sauce enregistré !" }))
    .catch((error) => res.status(400).json({ error }))
};


// modification d'une de ses sauces par l'utilisateur
exports.modifySauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id }).then((sauce) => {
    const filename = sauce.imageUrl.split("/images/")[1];
    fs.unlink(`images/${filename}`, () => {
      const sauceObject = req.file ? 
          {
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get("host")}/images/${ req.file.filename }`,
          } : { ...req.body };
      Sauce.updateOne( { _id: req.params.id }, { ...sauceObject, _id: req.params.id } )
        .then(() => res.status(200).json({ message: "Sauce modifiée !" }))
        .catch(error => res.status(400).json({ error }));
    });
  });
};

// suppression d'une de ses sauces par l'utilisateur
exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      const filename = sauce.imageUrl.split("/images/")[1];
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: "Sauce supprimé !" }))
          .catch((error) => res.status(400).json({ error }));
      });
    })
    .catch(error => res.status(500).json({ error }));
};

// liking / disliking d'une sauce 
exports.likeSauce = (req, res, next) => {
  const sauceId = req.params.id;
  const userId = req.body.userId;
  const like = req.body.like;
  // l'utilisateur likes une sauce pour la première fois (like === 1) 
  // ( on pousse l'userId vers le tableau usersLiked et on incrémente les likes)
  if (like === 1) {
    Sauce.updateOne( { _id: sauceId }, { $inc: { likes: like }, $push: { usersLiked: userId } } )
      .then(sauce => res.status(200).json({ message: "Sauce likée" }))
      .catch(error => res.status(500).json({ error }));
  }
  // l'utilisateur DISlikes une sauce pour la première fois (like === -1)
  // (on pousse l'userId vers le tableau usersLiked et on décrémente les likes)
  else if (like === -1) {
    Sauce.updateOne( { _id: sauceId }, { $inc: { dislikes: -1 * like }, $push: { usersDisliked: userId } } )
      .then(sauce => res.status(200).json({ message: "Sauce disikée" }))
      .catch(error => res.status(500).json({ error }));
  }
  // l'utilisateur reprend son like ou son dislike
  else {
    Sauce.findOne({ _id: sauceId })
      .then(sauce => {
        // l'utilisateur reprend son like :
        if (sauce.usersLiked.includes(userId)) {
          Sauce.updateOne( { _id: sauceId }, { $pull: { usersLiked: userId }, $inc: { likes: -1 } } )
            .then(sauce => { res.status(200).json({ message: "Like supprimé" }) })
            .catch(error => res.status(500).json({ error }));
        // l'utilisateur reprend son dislike :
        } else if (sauce.usersDisliked.includes(userId)) {
          Sauce.updateOne( { _id: sauceId }, { $pull: { usersDisliked: userId }, $inc: { dislikes: -1 } } )
            .then(sauce => { res.status(200).json( { message: "Dislike supprimé" } ) } )
            .catch(error => res.status(500).json( { error } ) );
        }
      })
      .catch(error => res.status(401).json( { error } ) );
  }
};