import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import random
from sklearn.ensemble import RandomForestClassifier

app = Flask(__name__)
CORS(app)

model = RandomForestClassifier(n_estimators=100)
is_trained = False

# === Game Variables ===
move_mapping = {"s": 0, "w": 1, "g": 2}
reverse_map = {0: "s", 1: "w", 2: "g"}
actions = ["s", "w", "g"]

history = []
user_moves = []
Q_table = {}
user_score = 0
comp_score = 0
total_rounds = 15

# === ML Functions ===
def train_model():
    global is_trained
    if len(history) < 6:
        return
    X, y = [], []
    for i in range(3, len(history)):
        X.append([move_mapping[history[j]["UserMove"]] for j in range(i - 3, i)])
        y.append(move_mapping[history[i]["UserMove"]])
    if X and y:
        model.fit(X, y)
        is_trained = True

def predict_next_move():
    if len(user_moves) < 3 or not is_trained:
        return None
    try:
        seq = [move_mapping[user_moves[-i]] for i in range(3, 0, -1)]
        pred = model.predict([seq])[0]
        return reverse_map[pred]
    except:
        return None

# === Game Strategy ===
def counter_move(move):
    if move == "s": return "g"  # Gun beats Snake
    if move == "w": return "s"  # Snake drinks Water
    if move == "g": return "w"  # Water douses Gun
    return random.choice(actions)

def get_q_move(state):
    if state not in Q_table:
        Q_table[state] = {a: 0 for a in actions}
    return max(Q_table[state], key=Q_table[state].get)

def update_q_table(state, action, reward):
    learning_rate = 0.3
    discount = 0.95
    if state not in Q_table:
        Q_table[state] = {a: 0 for a in actions}
    Q_table[state][action] += learning_rate * (
        reward + discount * max(Q_table[state].values()) - Q_table[state][action]
    )

def determine_winner(user, comp):
    if user == comp:
        return "Draw"
    if (user == "s" and comp == "w") or (user == "w" and comp == "g") or (user == "g" and comp == "s"):
        return "User"
    return "Computer"

def get_computer_move(round_no):
    state = "".join(user_moves[-3:]) if len(user_moves) >= 3 else ""

    if not is_trained and len(history) >= 6:
        train_model()

    if round_no <= 3:
        return random.choice(actions)

    predicted = predict_next_move()
    if predicted:
        return counter_move(predicted)
    elif state:
        return get_q_move(state)
    else:
        return random.choice(actions)

# === API Route ===
@app.route('/move', methods=['POST'])
def move():
    global user_score, comp_score

    data = request.get_json()
    user_move = data.get("move")
    if user_move not in move_mapping:
        return jsonify({"error": "Invalid move"}), 400

    round_no = len(history) + 1
    comp_move = get_computer_move(round_no)
    result = determine_winner(user_move, comp_move)

    # ✅ Fix: Reward is now from the computer's perspective
    reward = 1 if result == "Computer" else -1 if result == "User" else 0
    state = "".join(user_moves[-3:]) if len(user_moves) >= 3 else ""
    update_q_table(state, comp_move, reward)

    user_moves.append(user_move)
    history.append({"UserMove": user_move, "ComputerMove": comp_move, "Result": result})

    if result == "User":
        user_score += 1
    elif result == "Computer":
        comp_score += 1

    final_result = ""
    if round_no == total_rounds:
        if user_score > comp_score:
            final_result = "🏆 You are the overall winner!"
        elif comp_score > user_score:
            final_result = "🤖 Computer dominates the game!"
        else:
            final_result = "🤝 It's a tie after 15 rounds!"

    # ✅ Debug Log (prints server-side only)
    print(f"[Round {round_no}] User: {user_move}, Comp: {comp_move}, Predicted: {predict_next_move()}, Result: {result}, Reward: {reward}")

    return jsonify({
        "userMove": user_move,
        "compMove": comp_move,
        "result": result,
        "userScore": user_score,
        "compScore": comp_score,
        "finalMessage": final_result
    })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)
