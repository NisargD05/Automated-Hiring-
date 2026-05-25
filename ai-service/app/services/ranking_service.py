from app.services.candidate_ranker import rank_candidate


def rank_candidate_against_job(payload):
    return rank_candidate(payload)
