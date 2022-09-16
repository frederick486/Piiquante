const Sauce = require("../models/sauce");

//Permet de modifier le système de fichiers
const fs = require("fs");


// Récupération de toutes les sauces
exports.getAllSauces = (req, res, next) => {
//Utilisation de la méthode find() du modèle Mongoose qui renvoit un tableau de toutes les Sauces de notre base de données
  Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({ error: error }))
};


//récupération d'une sauce que l'utilisateur sélectionne
exports.getOneSauce = (req, res, next) => {
  //Utilisation de la méthode findOne() du modèle Mongoose qui renvoit la Sauce ayant le même _id que le paramètre de la requête
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => res.status(200).json(sauce))
    .catch(error => res.status(404).json({ error: error }))
};


// création d'une sauce
exports.createSauce = (req, res, next) => {
  //Création d'une constante pour obtenir un objet utilisable
  const sauceObject = JSON.parse(req.body.sauce);
  //Suppression de l'_id envoyé par le front-end
  delete sauceObject._id;
  //Conversion de l'objet "Sauce" en une chaîne "sauce"
  const sauce = new Sauce({
    ...sauceObject,
    //initialisation des likes/dislikes et des tableaux d'identifiants du model "sauce"
    likes: 0,
    dislikes: 0,
    usersDisliked: [],
    usersLiked: [],
    //Utilisation de l'URL complète de l'image
    imageUrl: `${req.protocol}://${req.get("host")}/images/${ req.file.filename }`,
  });
  //Enregistrement dans la base de données
  sauce.save()
    .then(() => res.status(201).json({ message: "Sauce enregistrée !" }))
    .catch((error) => res.status(400).json({ error }))
};


// modification d'une de ses sauces par l'utilisateur
// exports.modifySauce = (req, res, next) => {
//   Sauce.findOne({ _id: req.params.id }).then((sauce) => {
//     const filename = sauce.imageUrl.split("/images/")[1];
//     fs.unlink(`images/${filename}`, () => {
//       const sauceObject = req.file ? 
//           {
//             ...JSON.parse(req.body.sauce),
//             imageUrl: `${req.protocol}://${req.get("host")}/images/${ req.file.filename }`,
//           } : { ...req.body };
//       Sauce.updateOne( { _id: req.params.id }, { ...sauceObject, _id: req.params.id } )
//         .then(() => res.status(200).json({ message: "Sauce modifiée !" }))
//         .catch(error => res.status(400).json({ error }));
//     });
//   });
// };


exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file ? {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body };

  delete sauceObject._userId;
  Sauce.findOne({_id: req.params.id})
      .then((sauce) => {
          if (sauce.userId != req.auth.userId) {
              res.status(403).json({ message : 'unauthorized request'});
          } else {
            Sauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
              .then(() => res.status(200).json({message : 'Sauce modifiée !'}))
              .catch(error => res.status(401).json({ error }));
          }
      })
      .catch((error) => {
          res.status(400).json({ error });
      });
};


// suppression d'une de ses sauces par l'utilisateur
// exports.deleteSauce = (req, res, next) => {
//   //Utilisation de la méthode findOne() du modèle Mongoose qui renvoit la Sauce ayant le même _id que le paramètre de la requête
//   Sauce.findOne({ _id: req.params.id })
//     .then(sauce => {
//       //Séparation du nom du fichier grâce au "/images/"" contenu dans l'url
//       const filename = sauce.imageUrl.split("/images/")[1];
//       //Utilisation de la fonction unlink pour supprimer l'image et suppression de toute la Sauce
//       fs.unlink(`images/${filename}`, () => {
//         Sauce.deleteOne({ _id: req.params.id })
//           .then(() => res.status(200).json({ message: "Sauce supprimée !" }))
//           .catch((error) => res.status(400).json({ error }));
//       });
//     })
//     .catch(error => res.status(500).json({ error }));
// };



exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id})
      .then(sauce => {
          if (sauce.userId != req.auth.userId) {
              res.status(403).json({message: 'unauthorized request'});
          } else {
              const filename = sauce.imageUrl.split('/images/')[1];
              fs.unlink(`images/${filename}`, () => {
                    Sauce.deleteOne({_id: req.params.id})
                      .then(() => { res.status(200).json({message: 'Sauce supprimée !'})})
                      .catch(error => res.status(401).json({ error }));
              });
          }
      })
      .catch( error => {
          res.status(500).json({ error });
      });
};


// liking / disliking d'une sauce 
exports.likeSauce = (req, res, next) => {
  const sauceId = req.params.id;
  const userId = req.body.userId;
  const like = req.body.like;

  // Si l'utilisateur like une sauce pour la première fois (like === 1) 
  if (like === 1) {

    Sauce.updateOne( { _id: sauceId }, { 

      //incrémentation des likes
      $inc: { likes: like }, 

      // Ajout userId dans tableau usersLiked
      $push: { usersLiked: userId } 

    } )
      .then(sauce => res.status(200).json({ message: "Sauce likée" }))
      .catch(error => res.status(500).json({ error }));

  }
  // Sinon si l'utilisateur DISlikes une sauce pour la première fois (like === -1)
  else if (like === -1) {

    Sauce.updateOne( { _id: sauceId }, { 

      // Décrémentation des likes
      $inc: { dislikes: -1 * like }, 

      // Ajout userId dans tableau usersDisliked
      $push: { usersDisliked: userId } 

    } )
      .then(sauce => res.status(200).json({ message: "Sauce disikée" }))
      .catch(error => res.status(500).json({ error }));
  }
  // Sinon, l'utilisateur reprend son like ou son dislike
  else {
    Sauce.findOne({ _id: sauceId })
      .then(sauce => {
        // l'utilisateur reprend son like :
        if (sauce.usersLiked.includes(userId)) {
          
          Sauce.updateOne( { _id: sauceId }, { 
            // suppression de l'userId du tableau usersLiked[]
            $pull: { usersLiked: userId }, 

            //décrémentation des likes
            $inc: { likes: -1 } 

          } )
            .then(sauce => { res.status(200).json({ message: "Like supprimé" }) })
            .catch(error => res.status(500).json({ error }));

        // l'utilisateur reprend son dislike :
        } else if (sauce.usersDisliked.includes(userId)) {
          
          Sauce.updateOne( { _id: sauceId }, { 
            
            // suppression de l'userId du tableau usersDisliked[]
            $pull: { usersDisliked: userId }, 

            // Décrémentation des dislikes
            $inc: { dislikes: -1 } 
          
          } )
            .then(sauce => { res.status(200).json( { message: "Dislike supprimé" } ) } )
            .catch(error => res.status(500).json( { error } ) );
        }
      })
      .catch(error => res.status(401).json( { error } ) );
  }
};