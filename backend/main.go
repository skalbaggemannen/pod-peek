package main

import (
	"bytes"
	"context"
	corev1 "k8s.io/api/core/v1"
	"encoding/json"
	"net/http"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

func main() {
	http.HandleFunc("/api/pods", getPods)
	http.HandleFunc("/api/logs", getLogs)
        http.HandleFunc("/api/restart", restartPod)

	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		panic(err)
	}
}

func getPods(w http.ResponseWriter, r *http.Request) {
	config, err := clientcmd.BuildConfigFromFlags("", clientcmd.RecommendedHomeFile)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	pods, err := clientset.CoreV1().
		Pods("").
		List(context.TODO(), metav1.ListOptions{})

	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(pods.Items)
}

func getLogs(w http.ResponseWriter, r *http.Request) {
	podName := r.URL.Query().Get("pod")
	namespace := r.URL.Query().Get("namespace")

	if podName == "" {
		http.Error(w, "missing pod parameter", http.StatusBadRequest)
		return
	}

	if namespace == "" {
		namespace = "default"
	}

	config, err := clientcmd.BuildConfigFromFlags("", clientcmd.RecommendedHomeFile)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	req := clientset.CoreV1().
		Pods(namespace).
		GetLogs(podName, &corev1.PodLogOptions{})

	stream, err := req.Stream(context.Background())
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer stream.Close()

	buf := new(bytes.Buffer)
	buf.ReadFrom(stream)

	w.Header().Set("Content-Type", "text/plain")
	w.Write([]byte(buf.String()))
}

func restartPod(w http.ResponseWriter, r *http.Request) {
	podName := r.URL.Query().Get("pod")
	namespace := r.URL.Query().Get("namespace")

	if podName == "" {
		http.Error(w, "missing pod", http.StatusBadRequest)
		return
	}

	if namespace == "" {
		namespace = "default"
	}

	config, err := clientcmd.BuildConfigFromFlags("", clientcmd.RecommendedHomeFile)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	err = clientset.CoreV1().
		Pods(namespace).
		Delete(context.Background(), podName, metav1.DeleteOptions{})

	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	w.Write([]byte("restarted"))
}
