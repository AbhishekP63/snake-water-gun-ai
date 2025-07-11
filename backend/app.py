import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import random
from sklearn.ensemble import RandomForestClassifier

app = Flask(__name__)
CORS(app)

model = RandomForestClassifier(n_estimators=100)
is_trained = False

#  Game Variables 
move_mapping = {"s": 0, "w": 1, "g": 2}
reverse_map = {0: "s", 1: "w", 2: "g"}
actions = ["s", "w", "g"]

history = []
user_moves = []
Q_table = {}
user_score = 0
comp_score = 0

#  ML + Q-Learning Functions 
def train_model():
    global is_trained
    if len(history) < 6:
        return
    X, y = [], []
    for i in range(3, len(history)):
        prev = [move_mapping[history[j]["UserMove"]] for j in range(i - 3, i)]
        target = move_mapping[history[i]["UserMove"]]
        X.append(prev)
        y.append(target)
    model.fit(X, y)
    is_trained = True

def predict_next_move():
    if len(user_moves) < 3 or not is_trained:
        return None
    try:
        seq = [move_mapping[user_moves[-i]] for i in range(3, 0, -1)]
        pred = model.predict([seq])[0]
        return reverse_map[pred]
    except Exception as e:
        print("ML Prediction error:", e)
        return None

def get_q_move(state):
    if state not in Q_table:
        Q_table[state] = {a: 0 for a in actions}
    return max(Q_table[state], key=Q_table[state].get)

def update_q_table(state, action, reward):
    learning_rate = 0.4
    discount = 0.95
    if state not in Q_table:
        Q_table[state] = {a: 0 for a in actions}
    Q_table[state][action] += learning_rate * (
        reward + discount * max(Q_table[state].values()) - Q_table[state][action]
    )

def counter_move(user_move):
    if user_move == "s": return "g"
    if user_move == "w": return "s"
    if user_move == "g": return "w"
    return random.choice(actions)

def get_computer_move():
    state = "".join(user_moves[-3:]) if len(user_moves) >= 3 else ""
    if not is_trained:
        train_model()

    ml_pred = predict_next_move()
    if ml_pred:
        return counter_move(ml_pred)
    elif state:
        return get_q_move(state)
    else:
        return random.choice(actions)

def determine_winner(user, comp):
    if user == comp:
        return "Draw"
    elif (user == "s" and comp == "w") or (user == "w" and comp == "g") or (user == "g" and comp == "s"):
        return "User"
    return "Computer"

#  API 
@app.route('/move', methods=['POST'])
def move():
    global user_score, comp_score

    data = request.get_json()
    user_move = data.get("move")
    if user_move not in move_mapping:
        return jsonify({"error": "Invalid move"}), 400

    comp_move = get_computer_move()
    result = determine_winner(user_move, comp_move)

    reward = 1 if result == "User" else -1 if result == "Computer" else 0
    state = "".join(user_moves[-3:]) if len(user_moves) >= 3 else ""
    update_q_table(state, comp_move, reward)

    user_moves.append(user_move)
    history.append({"UserMove": user_move, "ComputerMove": comp_move, "Result": result})

    if result == "User":
        user_score += 1
    elif result == "Computer":
        comp_score += 1

    return jsonify({
        "userMove": user_move,
        "compMove": comp_move,
        "result": result,
        "userScore": user_score,
        "compScore": comp_score
    })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)
