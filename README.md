EN

BorsaLive - Real-Time Financial Trading & Portfolio Dashboard
A professional-grade, multi-platform financial trading and portfolio management dashboard with a dark-themed FinTech terminal aesthetic. It streams real-time market data via WebSockets, calculates technical indicators, manages orders, and persists state locally.

Technologies Used
HTML5 & CSS3 - Modern, responsive terminal UI styling using Tailwind CSS

JavaScript (ES6+) - Core application logic, event handling, and data structures

Binance WebSocket API - Real-time streaming live price feed integration

Chart.js - Interactive price charts with SMA and RSI indicator overlays

Browser LocalStorage - Persistent state management for balance, portfolio, and trade history

System Architecture and Flow
Data Collection: Real-time crypto and stock price feeds are ingested via WebSocket connections and updated instantly on the dashboard.

Technical Analysis Engine: Historical price data points are processed in real-time to compute SMA (20) overlays and dynamic RSI (14) indicator values.

Order Execution & Risk Management: Supports Market and Limit orders with integrated Stop-Loss and Take-Profit automated triggers.

Persistent State Management: User balances, open positions, pending limit orders, and executed trade histories are automatically synced to LocalStorage.

TR

BorsaLive - Canlı Borsa ve Portföy Takip Paneli
FinTech ve işlem terminali estetiğine sahip, profesyonel düzeyde çok platformlu canlı borsa ve portföy yönetim paneli. WebSocket üzerinden anlık piyasa verilerini akar, teknik indikatörleri hesaplar, emir yönetimini sağlar ve verileri yerel hafızada saklar.

Kullanılan Teknolojiler
HTML5 & CSS3 - Tailwind CSS ile modern ve duyarlı terminal arayüz tasarımı

JavaScript (ES6+) - Temel uygulama mantığı, olay yönetimi ve veri yapıları

Binance WebSocket API - Anlık canlı fiyat akışı entegrasyonu

Chart.js - SMA ve RSI indikatör katmanlarına sahip etkileşimli grafikler

Browser LocalStorage - Bakiye, portföy ve işlem geçmişi için kalıcı veri depolama

Sistem Mimarisi ve Akış
Veri Toplama: Kripto ve hisse senedi canlı fiyat akışları WebSocket bağlantıları üzerinden çekilir ve paneli anlık günceller.

Teknik Analiz Motoru: Geçmiş fiyat hareketleri işlenerek SMA (20) çizgisi ve dinamik RSI (14) indikatör değerleri canlı olarak hesaplanır.

Emir Gerçekleştirme ve Risk Yönetimi: Piyasa ve Limit emir tiplerini, otomatik Zarar Durdur (SL) ve Kar Al (TP) tetikleme mantığıyla destekler.

Kalıcı Durum Yönetimi: Kullanıcı bakiyesi, açık pozisyonlar, bekleyen limit emirleri ve geçmiş işlemler otomatik olarak LocalStorage üzerine senkronize edilir.
