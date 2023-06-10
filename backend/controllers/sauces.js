const { log } = require("console");
const Sauce = require("../models/sauce");
const fs = require("fs");

exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({ error: error }))
};

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => res.status(200).json(sauce))
    .catch(error => res.status(404).json({ error: error }))
};

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;  //Suppression de l'_id envoyé par le front-end
  const sauce = new Sauce({
    ...sauceObject,
    likes: 0,
    dislikes: 0,
    usersDisliked: [],
    usersLiked: [],
    imageUrl: `${req.protocol}://${req.get("host")}/images/${ req.file.filename }`,
  });
  sauce.save()
    .then(() => res.status(201).json({ message: "Sauce enregistrée !" }))
    .catch((error) => res.status(400).json({ error }))
};

exports.modifySauce = async (req, res) => {
  const sauceId = req.params.id;
  const userId = req.auth.userId;

  try {
    const sauce = await Sauce.findById(sauceId);
    if (sauce.userId === userId) {        
      if (req.file != null) {
        const oldFilename = sauce.imageUrl.split('/images/')[1];
        console.log("oldFilename :", oldFilename)
        fs.unlink(`images/${oldFilename}`, ()=> {}) 
        await sauce.updateOne(
          { 
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
          }
        );
        res.status(200).json("Modification du fichier image et des textes ou de l'image uniquement");        
      } else {
        await sauce.updateOne(
          { ...req.body }
        );
        res.status(200).json("Modification des textes uniquement");   
      }        
    } else {
      res.status(403).json("Echec Authentication");
    }
  } catch (error) {
    res.status(500).json(error);
  }
};

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

exports.likeSauce = (req, res, next) => {
  const sauceId = req.params.id;
  const userId = req.body.userId;
  const like = req.body.like;

  if (like === 1) {
    Sauce.updateOne( { _id: sauceId }, { 
      $inc: { likes: like }, 
      $push: { usersLiked: userId } 
    } )
      .then(sauce => res.status(200).json({ message: "Sauce likée" }))
      .catch(error => res.status(500).json({ error }));
  }
  else if (like === -1) {
    Sauce.updateOne( { _id: sauceId }, { 
      $inc: { dislikes: -1 * like }, 
      $push: { usersDisliked: userId } 

    } )
      .then(sauce => res.status(200).json({ message: "Sauce disikée" }))
      .catch(error => res.status(500).json({ error }));
  }
  else {
    Sauce.findOne({ _id: sauceId })
      .then(sauce => {
        if (sauce.usersLiked.includes(userId)) {          
          Sauce.updateOne( { _id: sauceId }, { 
            $pull: { usersLiked: userId }, 
            $inc: { likes: -1 } 
          } )
            .then(sauce => { res.status(200).json({ message: "Like supprimé" }) })
            .catch(error => res.status(500).json({ error }));
        } else if (sauce.usersDisliked.includes(userId)) {          
          Sauce.updateOne( { _id: sauceId }, {             
            $pull: { usersDisliked: userId }, 
            $inc: { dislikes: -1 }           
          } )
            .then(sauce => { res.status(200).json( { message: "Dislike supprimé" } ) } )
            .catch(error => res.status(500).json( { error } ) );
        }
      })
      .catch(error => res.status(401).json( { error } ) );
  }
};