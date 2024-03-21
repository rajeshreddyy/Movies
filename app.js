const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'moviesData.db')

let db = null
const initializeDatabaseAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000')
    })
  } catch (err) {
    console.log(`Database Error: ${err}`)
    process.exit(1)
  }
}
initializeDatabaseAndServer()

const dbObjToResponseObj = dbObj => {
  const responseObj = dbObj.map(eachobj => {
    return {
      movieName: eachobj.movie_name,
    }
  })
  return responseObj
}

const directorResponse = dbObj => {
  return dbObj.map(eachDirector => {
    return {
      directorId: eachDirector.director_id,
      directorName: eachDirector.director_name,
    }
  })
}

// API 1 (Returns a list of all movie names in the movie table)
app.get('/movies/', async (request, response) => {
  const getMoviesQuery = `
        SELECT
            movie_name
        FROM
            movie;
    `
  const movieNamesArr = await db.all(getMoviesQuery)
  // console.log(movieNamesArr)
  response.send(dbObjToResponseObj(movieNamesArr))
})

//API 2 (Creates a new movie in the movie table)
app.post('/movies/', async (request, response) => {
  const newMovieDetails = request.body
  const {directorId, movieName, leadActor} = newMovieDetails
  const addMovieQuery = `
    INSERT INTO
      movie(director_id, movie_name, lead_actor)
    VALUES(
    '${directorId}',
    '${movieName}',
    '${leadActor}'
    );
  `
  await db.run(addMovieQuery)
  // console.log(newMovieDetails)
  response.send('Movie Successfully Added')
})

//API 3 (Returns a movie based on the movie ID)
app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const getMovieQuery = `
    SELECT
      *
    FROM
      movie
    WHERE
      movie_id = ${movieId};

  `
  const dbResponse = await db.get(getMovieQuery)
  if (dbResponse === undefined) {
    response.status(400)
    response.send('Movie not found')
  } else {
    const responseObj = {
      movieId: dbResponse.movie_id,
      directorId: dbResponse.director_id,
      movieName: dbResponse.movie_name,
      leadActor: dbResponse.lead_actor,
    }
    response.send(responseObj)
  }
})

// API 4 (Updates the details of a movie in the movie table based on the movie ID)
app.put('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const updateMovieDetails = request.body
  const {directorId, movieName, leadActor} = updateMovieDetails
  const updateMovieQuery = `
    UPDATE
      movie
    SET
      director_id = '${directorId}',
      movie_name = '${movieName}',
      lead_actor = '${leadActor}'
    WHERE
      movie_id = ${movieId};
  `
  await db.run(updateMovieQuery)
  response.send('Movie Details Updated')
})

// API 5(Deletes a movie from the movie table based on the movie ID)
app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const deleteMovieQuery = `
    DELETE FROM
      movie
    WHERE
      movie_id = ${movieId};

  `
  await db.run(deleteMovieQuery)
  response.send('Movie Removed')
})

// API 6 (Returns a list of all directors in the director table)
app.get('/directors/', async (request, response) => {
  const getDirectorsQuery = `
    SELECT 
      *
    FROM
      director
  `
  const dbResponse = await db.all(getDirectorsQuery)
  response.send(directorResponse(dbResponse))
})

// API 7 (Returns a list of all movie names directed by a specific director)

app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const getDirectorMovies = `
    SELECT
      movie.movie_name
    FROM
      movie
    INNER JOIN 
      director ON movie.director_id = director.director_id
    WHERE
      director.director_id = ${directorId};
  `
  const dbResponse = await db.all(getDirectorMovies)
  response.send(dbObjToResponseObj(dbResponse))
})

module.exports = app
