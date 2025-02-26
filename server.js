const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const dbConnection = require('./knex');

const cookieParser = require('cookie-parser');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cookieParser()); 



//app.use(express.static(path.join(__dirname, 'home')));

app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Route pour recuperer les inscriptions
app.get('/api/inscriptions', async (req, res) => {
  try {
    const inscriptions = await dbConnection('users').select('*');
    res.json(inscriptions);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des inscriptions.', error: error.message });
  }
});

// Route pour ajouter une inscription
app.post('/api/inscriptions', async (req, res) => {
  try {
    console.log(req.body); 
    const { nom, prenom, username, email, password, role } = req.body;
    
     // si l'email existe déjà 
     const existingUser = await dbConnection('users').where('email', email).first();
     if (existingUser) {
       // si l'email existe déjà retourner  un code 400
       return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
     }
    
    
    const result = await dbConnection('users').insert({
      nom, prenom, username, email, password, role
    });
    res.status(201).json({ message: 'Inscription réussie', id: result[0] });
  } catch (error) {
    console.error('Erreur serveur:', error.message);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
});


//permettre au server de lire les cookies
app.get('/api/cookies', (req, res) => {
  res.json(req.cookies);
});


// Route pour la connexion
app.post('/api/connexion', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Chercher l'utilisateur par email
    const user = await dbConnection('users').where('email', email).first();
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé. Veuillez vous inscrire.' });
    }
    
    // si le mot de passe correspond
    if (user.password !== password) {
      return res.status(401).json({ message: 'Mot de passe incorrect.' });
    }
    
    // authentif reussie
    res.cookie('user_id', user.id, { httpOnly: false, maxAge: 3600000 });  // maintenir la session
    res.json({ message: 'Connexion réussie.', role: user.role });
    
  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({ message: 'Erreur lors de la connexion.', error: error.message });
  }
});


// Route de déconnexion
app.post('/api/deconnexion', (req, res) => {
  res.clearCookie('user_id');  // Supprimer le cookie de session
  res.json({ message: 'Déconnexion réussie.' });
});

app.use((req, res, next) => {
  console.log(`Requête reçue : ${req.method} ${req.url}`);
  next();
});

//verifier le cookie
app.get('/api/verify-session', (req, res) => {
  if (req.cookies.user_id) {
      res.json({ isAuthenticated: true });
  } else {
      res.json({ isAuthenticated: false });
  }
});

// Route pour récupérer les etudiant inscrit pour chaque cours
app.get('/api/inscriptionsCours', async (req, res) => {
  try {
    const etudiants = await dbConnection('students').select('*');
    res.json(etudiants);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des inscriptions.', error: error.message });
  }
});

app.post('/api/inscriptionsCours', async (req, res) => {
  try {
    console.log("Requête reçue :", req.body);

    const { nom, prenom, identifiant, email, password } = req.body;

    // Validation cote serveur
    if (!nom || !prenom || !identifiant || !email || !password) {
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    // si l'email existe déjà
    const existingStudent = await dbConnection('students').where('email', email).first();
    if (existingStudent) {
      console.log("Email déjà utilisé :", email);
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    // Insertion dans la base de données
    const result = await dbConnection('students').insert({
      nom, prenom, identifiant, email, password
    });

    console.log("Étudiant ajouté :", result);
    res.status(201).json({ message: "Inscription réussie", id: result[0] });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
});

//route pour ajouter un cours
app.post('/api/courses', async (req, res) => {
  try {
    const { title, description, admin_id } = req.body;

    // Validation des champs
    if (!title || !description) {
      return res.status(400).json({ message: 'Les champs titre et description sont obligatoires.' });
    }

    const createdAt = new Date().toISOString();

    const result = await dbConnection('Courses').insert({
      title,
      description,
      admin_id, 
      created_at: createdAt
    });

    res.status(201).json({ message: 'Cours créé avec succès.', id: result[0] });
  } catch (error) {
    console.error('Erreur lors de la création du cours :', error);
    res.status(500).json({ message: 'Erreur lors de la création du cours.', error: error.message });
  }
});

//route pour modifier un cours
app.put('/api/courses/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    const { title, description } = req.body;

    // Vérifie si le cours existe
    const existingCourse = await dbConnection('Courses').where('id', courseId).first();
    if (!existingCourse) {
      return res.status(404).json({ message: "Ce cours n'existe pas." });
    }

    
    await dbConnection('Courses')
      .where('id', courseId)
      .update({ title, description });

    res.status(200).json({ message: "Cours mis à jour avec succès." });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du cours :', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du cours.', error: error.message });
  }
});



//route pour supprimer un cours 
app.delete('/api/courses/:id', async (req, res) => {
  try {
    const courseId = req.params.id;

    // Vérification si le cours existe
    const existingCourse = await dbConnection('Courses').where('id', courseId).first();
    if (!existingCourse) {
      return res.status(404).json({ message: "Ce cours n'existe pas." });
    }

    // Suppression du cours
    await dbConnection('Courses').where('id', courseId).del();
    res.status(200).json({ message: "Cours supprimé avec succès." });
  } catch (error) {
    console.error('Erreur lors de la suppression du cours :', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du cours.', error: error.message });
  }
});

//route pour gerer la pagination
app.get('/api/courses', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const courses = await dbConnection('Courses')
      .select('*')
      .limit(limit)
      .offset(offset);

    const totalCourses = await dbConnection('Courses').count('id as count').first();

    res.json({
      total: totalCourses.count,
      page: parseInt(page),
      limit: parseInt(limit),
      data: courses,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des cours avec pagination :', error);
    res.status(500).json({ message: "Erreur lors de la récupération des cours.", error: error.message });
  }
});


//route pour rechercher un mot clé 
app.get('/api/courses/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Le paramètre de recherche 'q' est requis." });
    }

    const courses = await dbConnection('Courses')
      .where('title', 'like', `%${q}%`)
      .orWhere('description', 'like', `%${q}%`);

    res.json(courses);
  } catch (error) {
    console.error('Erreur lors de la recherche des cours :', error);
    res.status(500).json({ message: "Erreur lors de la recherche des cours.", error: error.message });
  }
});


// Lancer le serveur
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});

