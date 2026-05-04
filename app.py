import os
from flask import Flask, render_template, request, jsonify
import cv2
import numpy as np
import tensorflow as tf
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Create uploads folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Categories for classification
categories = ['Utilities', 'Travel', 'Office', 'Entertainment']

# Load the trained model
model = tf.keras.models.load_model('model/invoice_classifier_mlp.h5')

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def preprocess_image(image_path):
    """Preprocess the image for model input"""
    # Read and preprocess image
    img = cv2.imread(image_path)
    img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    img_resized = cv2.resize(img_gray, (64, 64))
    img_normalized = img_resized.astype(np.float32) / 255.0
    img_flattened = img_normalized.flatten().reshape(1, -1)
    return img_flattened

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/classify', methods=['POST'])
def classify_invoice():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        try:
            # Save the file
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Preprocess the image
            processed_image = preprocess_image(filepath)
            
            # Make prediction
            prediction = model.predict(processed_image)
            predicted_class = np.argmax(prediction)
            confidence = float(prediction[0][predicted_class])
            
            # Get probabilities for all classes
            class_probabilities = {
                category: float(prob) 
                for category, prob in zip(categories, prediction[0])
            }
            
            # Clean up - remove uploaded file
            os.remove(filepath)
            
            return jsonify({
                'category': categories[predicted_class],
                'confidence': confidence,
                'probabilities': class_probabilities
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
            
    return jsonify({'error': 'Invalid file type'}), 400

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
