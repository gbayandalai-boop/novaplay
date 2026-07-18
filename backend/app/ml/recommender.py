import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

def build_matrix(users, movies, history):
    user_ids = list(set([h.user_id for h in history]))
    movie_ids = list(set([h.movie_id for h in history]))

    user_index = {u: i for i, u in enumerate(user_ids)}
    movie_index = {m: i for i, m in enumerate(movie_ids)}

    matrix = np.zeros((len(user_ids), len(movie_ids)))

    for h in history:
        matrix[user_index[h.user_id]][movie_index[h.movie_id]] = 1

    return matrix, user_index, movie_index


def recommend(user_id, matrix, user_index, movie_index, movies):
    if user_id not in user_index:
        return movies[:10]

    user_vec = matrix[user_index[user_id]].reshape(1, -1)

    similarity = cosine_similarity(user_vec, matrix)[0]

    similar_users = similarity.argsort()[::-1][1:5]

    scores = np.zeros(matrix.shape[1])

    for u in similar_users:
        scores += matrix[u]

    watched = matrix[user_index[user_id]]

    result = []
    for movie_id, idx in movie_index.items():
        if watched[idx] == 0:
            result.append((scores[idx], movie_id))

    result.sort(reverse=True)

    recommended_ids = [m_id for _, m_id in result[:10]]

    return [m for m in movies if m.id in recommended_ids]