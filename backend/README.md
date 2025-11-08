# **Design Document: Real-Time Spending Coach**

## **Overview**

The Real-Time Spending Coach is a conversational financial assistant that reacts instantly to new purchases.
It classifies each transaction, learns from user feedback, predicts future spending behavior, and sends timely nudges through iMessage (via Photon).

Instead of dashboards or static reports, the system engages users in natural conversation — creating reflection and awareness in real time.

The system integrates with **Knot** for transaction data, **Dedalus (MCP)** for classification agents, **Photon** for notifications, and **Clerk** for authentication.

---

## **Problem Statement**

Most personal finance tools notify users only after money is already spent.
The user becomes aware of overspending too late.
Our solution intervenes at the moment of purchase, engaging the user in a quick, conversational check-in that reinforces healthy spending decisions.

---

## **Core MVP Objectives**

The MVP demonstrates an end-to-end intelligent feedback loop:

1. Detect a purchase (via Knot or mock data).
2. Classify the purchase as **Need** or **Want** using a Dedalus-powered agent.
3. Store classification data and user feedback.
4. Message the user via Photon iMessage to confirm the classification.
5. Receive the user’s reply (Need or Want).
6. Update the database with the corrected label.
7. Predict when the user might make a similar purchase next.
8. Send a preemptive nudge through iMessage if the purchase is likely to recur soon.
9. Provide a simple UI (via frontend) showing recent transactions and predictions.

---

## **Architecture Overview**

### **System Components**

| Component                                  | Responsibility                                                                                              |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| **Backend (Flask)**                        | Orchestrates data flow, exposes APIs, handles webhook events, calls agent and prediction modules.           |
| **Classification Agent (Dedalus/MCP)**     | Receives item + merchant info, returns structured output `{need_or_want, category, confidence, reasoning}`. |
| **Database (Snowflake or local fallback)** | Stores transactions, classifications, user labels, predictions, and history.                                |
| **Notifications (Photon)**                 | Sends and receives iMessage-based interactions with users.                                                  |
| **Authentication (Clerk)**                 | Manages user sessions and securely links users to transactions.                                             |
| **Frontend (Next.js/Vite)**                | Minimal visualization for summary and demo — lists recent transactions and predictions.                     |

---

### **Data Flow**

```
[User Purchase]
      ↓
[Knot API → Flask Backend]
      ↓
[Classification Agent (Dedalus)]
      ↓
{need_or_want, category, confidence}
      ↓
[Database: store transaction + classification]
      ↓
[Photon iMessage: “Was this a NEED or WANT?”]
      ↓
[User Reply → Photon Webhook → Backend]
      ↓
[Database: update user label]
      ↓
[Prediction Engine: estimate next purchase + savings]
      ↓
[Photon iMessage: “Skipping this saves $X/yr. Want to skip?”]
      ↓
[Frontend: display summary for demo]
```

---

## **API Endpoints**

| Endpoint                  | Method | Description                                                                            |
| ------------------------- | ------ | -------------------------------------------------------------------------------------- |
| `/events/transaction`     | POST   | Receives a new purchase event. Calls classification agent and sends user notification. |
| `/notifications/reply`    | POST   | Receives user’s reply (Need/Want) and updates database.                                |
| `/user/<user_id>/summary` | GET    | Returns recent transactions and predictions for demo display.                          |

---

## **Database Schema (Simplified)**

**users**

* id (primary key)
* name
* clerk_id

**transactions**

* id (primary key)
* user_id
* merchant
* item
* amount
* timestamp

**classifications**

* transaction_id (foreign key)
* need_or_want
* category
* confidence
* reasoning

**user_labels**

* transaction_id (foreign key)
* user_label (Need/Want)
* updated_at

**predictions**

* transaction_id (foreign key)
* next_eta
* probability
* yearly_savings_estimate

---

## **Integration Details**

### **Knot**

* Provides merchant and transaction data.
* Used to trigger the backend `/events/transaction` endpoint.

### **Dedalus / MCP**

* Classification logic.
* Should be callable via REST or local RPC from backend.
* Returns structured result with reasoning and confidence.

### **Photon**

* Handles sending and receiving iMessages.
* Used to send two message types:

  1. Immediate post-purchase reflection (“Need or Want?”)
  2. Predictive nudge (“You usually buy coffee tomorrow morning…”)

### **Clerk**

* Manages user auth.
* Provides user identity for message routing and secure linking to Knot data.

---

## **Frontend Summary Page**

Minimal React (or Vite) app showing:

* List of last 5 transactions
* Label (Need/Want)
* Predicted next purchase time
* Savings estimate if skipped

The frontend exists mainly to visualize backend data for judges.

---

## **MVP Scope Checklist**

| Area                 | Deliverable                       | Owner        |
| -------------------- | --------------------------------- | ------------ |
| Flask backend setup  | Skeleton with 3 endpoints         | Tony / Quang |
| Classification agent | Dedalus MCP integration           | Tony         |
| Database layer       | Schema + CRUD stubs               | Nguyen       |
| Photon integration   | Mock + real notification pipeline | Quang        |
| Clerk auth           | Basic session and user linking    | Quang        |
| Frontend             | Simple summary page               | Noctorious   |
| Prediction model     | Simple rule-based estimation      | Tony         |
| Integration test     | End-to-end mock transaction flow  | Team         |

---

## **Demo Flow for HackPrinceton**

1. Submit a fake transaction via `curl` or mock event.
2. Backend calls classification agent → returns “Want”.
3. User (simulated) receives message via Photon → replies “Need”.
4. Database updates classification with user feedback.
5. Prediction model runs and identifies likely future purchase.
6. System sends a preemptive nudge.
7. Frontend page displays full chain and savings estimate.

Total demo length: under 2 minutes.

---

## **Sponsor Relevance**

| Sponsor            | Integration            | Relevance                        |
| ------------------ | ---------------------- | -------------------------------- |
| **Knot**           | Transaction ingestion  | Demonstrates real-time data flow |
| **Dedalus**        | Classification agent   | MCP + AI reasoning               |
| **Photon**         | Notification transport | Conversational interface         |
| **Clerk**          | Auth                   | Secure user context              |
| **Chestnut Forty** | Prediction logic       | Behavioral AI modeling           |

This architecture directly qualifies for multiple special tracks (Knot, Dedalus, Photon, Chestnut Forty) and fits the **Business & Enterprise** main track.

---

## **Design Philosophy**

* Build for reliability and demonstration clarity, not complexity.
* Prioritize end-to-end loop over feature depth.
* Ensure every module produces visible output in logs or messages.
* Design for “wow” in under 120 seconds: instant feedback, user interaction, prediction.

---

## **Future Work (Post-MVP)**

* Emotional state tracking and progress visualization.
* Richer category detection and multi-agent classification.
* Personal financial goals and savings tracking.
* Personalized tone adaptation in messages.
* Integration with multiple messaging platforms (Slack, WhatsApp).

---

## **Appendix: Technology Stack**

| Layer           | Technology                                                                |
| --------------- | ------------------------------------------------------------------------- |
| Backend         | Python Flask                                                              |
| Agent Framework | Dedalus / MCP                                                             |
| Database        | Snowflake (or SQLite fallback)                                            |
| Messaging       | Photon (iMessage)                                                         |
| Auth            | Clerk                                                                     |
| Frontend        | Next.js or Vite + React                                                   |
| Hosting         | Local or temporary cloud instance                                         |
| Source Control  | GitHub (single repo with `/backend`, `/agents`, `/frontend`, `/database`) |

